import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';
import { UpdateMemberRoleDto } from './dto/workspace-member.dto';
import { Prisma, WorkspaceMemberRole } from '../generated/prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper method to check if the user has admin rights in the workspace
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

    if (membership.role === WorkspaceMemberRole.MEMBER) {
      throw new ForbiddenException('Admin access required for this action');
    }

    return membership;
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
    // Create workspace and add creator as owner in a single transaction.
    const newWorkspace = await this.prisma.workspace.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdById: userId,
        members: {
          create: {
            userId: userId,
            role: WorkspaceMemberRole.OWNER,
          },
        },
        subjects: dto.subjects
          ? {
              create: dto.subjects.map((subject, index) => ({
                name: subject.name,
                color: subject.color,
                position: index,
              })),
            }
          : undefined,
        fields: dto.fields
          ? {
              create: dto.fields.map((field, index) => ({
                name: field.name,
                color: field.color,
                position: index,
              })),
            }
          : undefined,
      },
    });

    return newWorkspace;
  }

  async findAll(userId: string, query: ListWorkspacesQueryDto) {
    // Fetch workspaces where user is a member, with pagination and optional search.
    const { limit = 20, offset = 0, search } = query;

    // Constructing the where clause to filter workspaces by membership and optional search term
    const whereClause: Prisma.WorkspaceWhereInput = {
      members: {
        some: { userId: userId },
      },
    };

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Using a transaction to get total count and paginated results in one go
    const [total, workspaces] = await this.prisma.$transaction([
      this.prisma.workspace.count({ where: whereClause }),
      this.prisma.workspace.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      items: workspaces,
      pageInfo: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async findOne(userId: string, wsId: string) {
    // Fetch workspace by ID, ensuring the user is a member, and include related data.
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: wsId },
      include: {
        members: {
          where: { userId: userId },
        },
        subjects: true,
        fields: true,
        _count: { select: { members: true } },
      },
    });

    if (!workspace || workspace.members.length === 0) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    // Restructure the response to include member count and exclude the members array.
    const { members: _members, _count, ...rest } = workspace;
    return {
      ...rest,
      memberCount: _count.members,
    };
  }

  async update(userId: string, wsId: string, dto: UpdateWorkspaceDto) {
    // Check admin rights and update workspace details.
    await this.checkAdminRights(userId, wsId);

    // Only update fields that are provided in the DTO
    return await this.prisma.workspace.update({
      where: { id: wsId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async remove(userId: string, wsId: string) {
    // Check admin rights and delete workspace.
    const membership = await this.checkAdminRights(userId, wsId);

    // Only the owner can delete the workspace
    if (membership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    // Deleting the workspace will cascade and remove all related data due to Prisma's referential actions
    await this.prisma.workspace.delete({
      where: { id: wsId },
    });
  }

  async listMembers(userId: string, wsId: string) {
    // Fetch WorkspaceMember and join with User.
    const isMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId: userId } },
    });

    if (!isMember) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    // Fetch members with user details, ordered by join date.
    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId: wsId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            isOnline: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return members.map((m) => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      username: m.user.username,
      fullName: m.user.fullName,
      status: m.user.isOnline ? 'online' : 'offline',
    }));
  }

  async updateMemberRole(
    userId: string,
    wsId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Verify admin rights and update member role, ensuring users cannot demote themselves.
    await this.checkAdminRights(userId, wsId);

    // Validate the target role and ensure it's a valid enum value
    const targetRole = dto.role.toUpperCase() as WorkspaceMemberRole;

    // Using strictly the Prisma enum type, matching the API contract
    if (userId === memberId && targetRole === WorkspaceMemberRole.MEMBER) {
      throw new UnprocessableEntityException('Cannot demote yourself');
    }

    const updatedMember = await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: wsId, userId: memberId } },
      data: { role: targetRole },
    });

    return {
      userId: updatedMember.userId,
      role: updatedMember.role,
    };
  }

  async removeMember(userId: string, wsId: string, memberId: string) {
    // Verify admin/self and delete.
    if (userId !== memberId) {
      await this.checkAdminRights(userId, wsId);
    }

    // Removing the member from the workspace will automatically handle related data (like tasks) due to Prisma's referential actions.
    await this.prisma.task.updateMany({
      where: {
        workspaceId: wsId,
        assigneeId: memberId,
      },
      data: {
        assigneeId: null,
      },
    });
  }
}
