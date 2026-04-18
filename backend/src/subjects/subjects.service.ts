import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { Prisma, WorkspaceMemberRole } from '../generated/prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Centralized authorization guard to verify workspace access.
  private async checkMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new NotFoundException(
        'Workspace not found or you are not a member',
      );
    }
    return membership;
  }

  // Centralized authorization guard to enforce Role-Based Access Control (RBAC).
  private async checkAdminRights(userId: string, workspaceId: string) {
    const membership = await this.checkMembership(userId, workspaceId);

    if (membership.role === WorkspaceMemberRole.MEMBER) {
      throw new ForbiddenException(
        'Admin access required to configure subjects',
      );
    }
    return membership;
  }

  async findAll(userId: string, workspaceId: string) {
    await this.checkMembership(userId, workspaceId);

    return await this.prisma.subject.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, workspaceId: string, dto: CreateSubjectDto) {
    await this.checkAdminRights(userId, workspaceId);

    const currentCount = await this.prisma.subject.count({
      where: { workspaceId },
    });

    try {
      const newSubject = await this.prisma.subject.create({
        data: {
          workspaceId,
          name: dto.name,
          color: dto.color,
          position: currentCount,
        },
      });

      // TODO: [Feature - WebSockets] Emit 'subject_created' event to the 'workspace:{workspaceId}' room.
      return newSubject;
    } catch (error) {
      // Gracefully handle unique constraint violations (e.g., duplicate subject names).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Subject '${dto.name}' already exists in this workspace`,
        );
      }
      throw error;
    }
  }

  async update(userId: string, id: string, updateData: UpdateSubjectDto) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.checkAdminRights(userId, subject.workspaceId);

    try {
      const updatedSubject = await this.prisma.subject.update({
        where: { id },
        data: {
          name: updateData.name,
          color: updateData.color,
        },
      });

      // TODO: [Feature - WebSockets] Emit 'subject_updated' event to the 'workspace:{subject.workspaceId}' room.
      return updatedSubject;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A subject with this name already exists');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    const subject = await this.prisma.subject.findUnique({ where: { id } });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    await this.checkAdminRights(userId, subject.workspaceId);

    try {
      await this.prisma.subject.delete({
        where: { id },
      });

      // TODO: [Feature - WebSockets] Emit 'subject_deleted' event to the 'workspace:{subject.workspaceId}' room.
    } catch (error) {
      // P2003 corresponds to a Foreign Key Constraint Failure.
      // This strict check prevents the deletion of subjects that are currently assigned to active tasks.
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot delete this subject because there are tasks linked to it. Please reassign the tasks first.',
          );
        }
      }
      throw error;
    }
  }
}
