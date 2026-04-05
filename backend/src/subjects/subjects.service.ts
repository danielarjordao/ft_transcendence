import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Ensures only Admins or Owners can modify workspace configurations.
  private async checkAdminRights(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });

    if (!membership) {
      throw new NotFoundException(
        'Workspace not found or you are not a member',
      );
    }

    // Direct string comparison avoids TypeScript runtime resolution errors
    // when dealing with generated Enums from external folders.
    if (membership.role === 'MEMBER') {
      throw new ForbiddenException(
        'Admin access required to configure subjects',
      );
    }

    return membership;
  }

  async findAll(workspaceId: string) {
    // Retrieves all subjects belonging to a specific workspace.
    // The results are explicitly ordered by the 'position' field to maintain
    // the visual layout defined by the API contract.
    return await this.prisma.subject.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, workspaceId: string, dto: CreateSubjectDto) {
    // TODO: Emit WebSocket event 'subject_created' to 'workspace:{workspaceId}'.

    await this.checkAdminRights(userId, workspaceId);

    // Calculating the current total of subjects ensures the new
    // subject receives the correct 'position' integer, placing it at the end of the list.
    const currentCount = await this.prisma.subject.count({
      where: { workspaceId },
    });

    try {
      return await this.prisma.subject.create({
        data: {
          workspaceId,
          name: dto.name,
          color: dto.color,
          position: currentCount,
        },
      });
    } catch (error) {
      // Prisma throws a P2002 error if a unique constraint is violated.
      // The schema defines '@@unique([workspaceId, name])', preventing duplicate names.
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

  async update(
    userId: string,
    id: string,
    updateData: Partial<CreateSubjectDto>,
  ) {
    // TODO: Emit WebSocket event 'subject_updated' to the respective workspace room.

    // Find the subject to get its workspaceId for permission checks
    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    // Verify if the user is an admin in that specific workspace
    await this.checkAdminRights(userId, subject.workspaceId);

    try {
      // The 'update' method modifies an existing database record.
      // Undefined fields within 'updateData' are safely ignored by Prisma.
      return await this.prisma.subject.update({
        where: { id },
        data: {
          name: updateData.name,
          color: updateData.color,
        },
      });
    } catch (error) {
      // EXPLANATION: P2002 indicates the new name conflicts with an existing record.
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
    // TODO: Emit WebSocket event 'subject_deleted' to the respective workspace room.

    const subject = await this.prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new NotFoundException('Subject not found');

    await this.checkAdminRights(userId, subject.workspaceId);

    try {
      // Deletes the record directly based on its unique identifier.
      await this.prisma.subject.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003 is triggered when a Foreign Key constraint fails.
        // This gracefully blocks the deletion if there are any Tasks linked to this Subject.
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
