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
import { AppGateway } from 'src/realtime/app.gateway';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  private async checkAdminRights(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    if (membership.role === WorkspaceMemberRole.MEMBER) {
      throw new ForbiddenException('Admin access required for this action');
    }

    return membership;
  }

  async create(userId: string, dto: CreateWorkspaceDto) {
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

    // Architectural Focus: Reuse findOne to guarantee the returned "workspace details object"
    // exactly matches the contract, avoiding payload inconsistencies.
    return this.findOne(userId, newWorkspace.id);
  }

  async findAll(userId: string, query: ListWorkspacesQueryDto) {
    const { limit = 20, offset = 0, search } = query;

    const whereClause: Prisma.WorkspaceWhereInput = {
      members: { some: { userId: userId } },
    };

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

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
    // Architectural Focus (Security): Use findFirst to enforce that the requesting
    // user MUST be a member of this workspace at the root query level.
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: wsId,
        members: { some: { userId: userId } },
      },
      include: {
        members: {
          take: 5, // Member summary for the frontend
          include: {
            user: { select: { id: true, avatarUrl: true, username: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        subjects: true,
        fields: true,
        _count: { select: { members: true } },
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      subjects: workspace.subjects,
      fields: workspace.fields,
      memberCount: workspace._count.members,
      memberSummary: workspace.members.map((m) => ({
        id: m.userId,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
      })),
      createdAt: workspace.createdAt.toISOString(),
    };
  }

  async update(userId: string, wsId: string, dto: UpdateWorkspaceDto) {
    await this.checkAdminRights(userId, wsId);

    const updatedWorkspace = await this.prisma.workspace.update({
      where: { id: wsId },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    this.appGateway.server
      .to(`workspace:${wsId}`)
      .emit('workspace_updated', updatedWorkspace);

    return updatedWorkspace;
  }

  async remove(userId: string, wsId: string) {
    const membership = await this.checkAdminRights(userId, wsId);

    if (membership.role !== WorkspaceMemberRole.OWNER) {
      throw new ForbiddenException('Only the workspace owner can delete it');
    }

    await this.prisma.workspace.delete({ where: { id: wsId } });

    this.appGateway.server
      .to(`workspace:${wsId}`)
      .emit('workspace_deleted', { id: wsId });
  }

  async listMembers(userId: string, wsId: string) {
    const isMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId: userId } },
    });

    if (!isMember) {
      throw new NotFoundException('Workspace not found or access denied');
    }

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

    // Architectural Focus: Map database structures to the exact API contract (Section 3.6).
    // We explicitly lowercase the 'role' enum to match the frontend expectations.
    return members.map((m) => ({
      userId: m.userId,
      username: m.user.username,
      fullName: m.user.fullName,
      role: m.role.toLowerCase(),
      status: m.user.isOnline ? 'online' : 'offline',
    }));
  }

  async updateMemberRole(
    userId: string,
    wsId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.checkAdminRights(userId, wsId);

    const targetRole = dto.role.toUpperCase() as WorkspaceMemberRole;

    if (userId === memberId && targetRole === WorkspaceMemberRole.MEMBER) {
      throw new UnprocessableEntityException('Cannot demote yourself');
    }

    // Architectural Focus: Use 'include' to fetch the related User data atomically during the update,
    // fulfilling the API.md requirement to return the fully populated member object.
    const updatedMember = await this.prisma.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: wsId, userId: memberId } },
      data: { role: targetRole },
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
    });

    const formattedMember = {
      userId: updatedMember.userId,
      username: updatedMember.user.username,
      fullName: updatedMember.user.fullName,
      role: updatedMember.role.toLowerCase(),
      status: updatedMember.user.isOnline ? 'online' : 'offline',
    };

    this.appGateway.server
      .to(`workspace:${wsId}`)
      .emit('member_role_updated', formattedMember);

    return formattedMember;
  }

  async removeMember(userId: string, wsId: string, memberId: string) {
    // Validates if the user is leaving voluntarily or if an admin is removing them.
    if (userId !== memberId) {
      await this.checkAdminRights(userId, wsId);
    }

    const targetMembership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: wsId, userId: memberId } },
    });

    if (!targetMembership) {
      throw new NotFoundException('Member not found in this workspace');
    }

    if (
      targetMembership.role === WorkspaceMemberRole.OWNER &&
      userId !== memberId
    ) {
      throw new ForbiddenException('Owner cannot be removed from workspace');
    }

    // Atomic boundary: Ensures tasks are unassigned strictly before the member is purged.
    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          workspaceId: wsId,
          assigneeId: memberId,
        },
        data: { assigneeId: null },
      });

      await tx.workspaceMember.delete({
        where: { workspaceId_userId: { workspaceId: wsId, userId: memberId } },
      });
    });

    this.appGateway.server
      .to(`workspace:${wsId}`)
      .emit('member_removed', { memberId });
  }
}
