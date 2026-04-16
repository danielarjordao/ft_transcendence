import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { Prisma, WorkspaceMemberRole } from '../generated/prisma/client'; // <-- Usando Enum

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

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

  private async checkAdminRights(userId: string, workspaceId: string) {
    const membership = await this.checkMembership(userId, workspaceId);

    if (membership.role === WorkspaceMemberRole.MEMBER) {
      throw new ForbiddenException('Admin access required to configure fields');
    }
    return membership;
  }

  async findAll(userId: string, workspaceId: string) {
    await this.checkMembership(userId, workspaceId);

    return await this.prisma.field.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, workspaceId: string, dto: CreateFieldDto) {
    // TODO: Emit WebSocket event 'field_created' to 'workspace:{workspaceId}'.
    await this.checkAdminRights(userId, workspaceId);

    const currentCount = await this.prisma.field.count({
      where: { workspaceId },
    });

    try {
      return await this.prisma.field.create({
        data: {
          workspaceId,
          name: dto.name,
          color: dto.color,
          position: currentCount,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Field '${dto.name}' already exists in this workspace`,
        );
      }
      throw error;
    }
  }

  async update(userId: string, id: string, updateData: UpdateFieldDto) {
    // TODO: Emit WebSocket event 'field_updated' to the respective workspace room.
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found');

    await this.checkAdminRights(userId, field.workspaceId);

    try {
      return await this.prisma.field.update({
        where: { id },
        data: {
          name: updateData.name,
          color: updateData.color,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A field with this name already exists');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    // TODO: Emit WebSocket event 'field_deleted' to the respective workspace room.
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found');

    await this.checkAdminRights(userId, field.workspaceId);

    try {
      await this.prisma.field.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003 = Foreign Key Constraint Falhou
        if (error.code === 'P2003') {
          throw new ConflictException(
            'Cannot delete this field because there are tasks linked to it. Please reassign the tasks first.',
          );
        }
      }
      throw error;
    }
  }
}
