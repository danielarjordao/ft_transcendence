import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { Prisma } from '../generated/prisma/client';

@Injectable()
export class FieldsService {
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
      throw new ForbiddenException('Admin access required to configure fields');
    }

    return membership;
  }

  async findAll(workspaceId: string) {
    // Retrieves all fields belonging to a specific workspace.
    // The results are explicitly ordered by the 'position' field to maintain
    // the visual layout defined by the API contract.
    return await this.prisma.field.findMany({
      where: { workspaceId },
      orderBy: { position: 'asc' },
    });
  }

  async create(userId: string, workspaceId: string, dto: CreateFieldDto) {
    // TODO: Emit WebSocket event 'field_created' to 'workspace:{workspaceId}'.

    await this.checkAdminRights(userId, workspaceId);

    // Calculating the current total of fields ensures the new
    // field receives the correct 'position' integer, placing it at the end of the list.
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
      // Prisma throws a P2002 error if a unique constraint is violated.
      // The schema defines '@@unique([workspaceId, name])', preventing duplicate names.
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

  async update(
    userId: string,
    id: string,
    updateData: Partial<CreateFieldDto>,
  ) {
    // TODO: Emit WebSocket event 'field_updated' to the respective workspace room.

    // Find the field to know which workspace it belongs to
    const field = await this.prisma.field.findUnique({ where: { id } });
    if (!field) throw new NotFoundException('Field not found');

    // Verify if the user is an admin in that specific workspace
    await this.checkAdminRights(userId, field.workspaceId);

    try {
      //  The 'update' method modifies an existing database record.
      // Undefined fields within 'updateData' are safely ignored by Prisma.
      return await this.prisma.field.update({
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
      // Deletes the record directly based on its unique identifier.
      await this.prisma.field.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2003 is triggered when a Foreign Key constraint fails.
        // This gracefully blocks the deletion if there are any Tasks linked to this Field.
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
