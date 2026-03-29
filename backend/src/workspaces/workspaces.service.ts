import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';
import {
  InviteMemberDto,
  WorkspaceInvitation,
} from './dto/workspace-invitation.dto';
import { UpdateMemberRoleDto } from './dto/workspace-member.dto';

@Injectable()
export class WorkspacesService {
  // TODO: Remove mocks when Prisma is integrated
  private workspaceMembers = [
    {
      userId: 'usr_123',
      workspaceId: 'ws_1',
      username: 'ana_laura',
      fullName: 'Ana Laura',
      role: 'admin',
      status: 'online',
    },
    {
      userId: 'usr_456',
      workspaceId: 'ws_1',
      username: 'murilo_db',
      fullName: 'Murilo',
      role: 'member',
      status: 'offline',
    },
  ];

  private workspaceInvitations: WorkspaceInvitation[] = [];

  create(userId: string, dto: CreateWorkspaceDto) {
    // TODO: Replace with Prisma - Create workspace, assign caller as 'owner' in WorkspaceMember.
    // TODO: If dto.subjects or dto.fields are provided, create them in the same Prisma transaction.
    return {
      id: `ws_${Date.now()}`,
      ...dto,
      createdAt: new Date().toISOString(),
    };
  }

  findAll(userId: string, query: ListWorkspacesQueryDto) {
    // TODO: Replace with Prisma - Find workspaces where the user is a member. Apply limit, offset, and search.
    const { limit = 20, offset = 0 } = query;
    return {
      items: [
        {
          id: 'ws_1',
          name: 'Fazelo Core',
          description: 'Main product workspace.',
          subjects: [],
          fields: [],
        },
      ],
      pageInfo: { limit, offset, total: 1, hasMore: false },
    };
  }

  findOne(userId: string, wsId: string) {
    // TODO: Replace with Prisma - Find workspace by ID. Throw 403 if user is not a member.
    return {
      id: wsId,
      name: 'Fazelo Core',
      description: 'Main product workspace.',
      subjects: [],
      fields: [],
      memberCount: 1,
      createdAt: new Date().toISOString(),
    };
  }

  update(userId: string, wsId: string, dto: UpdateWorkspaceDto) {
    // TODO: Replace with Prisma - Verify if user is admin/owner. Update workspace data.
    return {
      id: wsId,
      ...dto,
      updatedAt: new Date().toISOString(),
    };
  }

  remove(userId: string, wsId: string) {
    // TODO: Replace with Prisma - Verify if user is owner. Delete workspace and cascade relations.
    // TODO: Remove console.log and perform actual deletion in DB.
    console.log(`User ${userId} requested deletion of workspace ${wsId}`);
    return;
  }

  listMembers(userId: string, wsId: string) {
    // TODO: Use Prisma to verify 'userId' has access to this workspace.
    // TODO: Use Prisma to fetch WorkspaceMember records where workspaceId = wsId.
    // TODO: Join with the User table to include username, fullName, etc.
    return this.workspaceMembers
      .filter((m) => m.workspaceId === wsId)
      .map(({ workspaceId: _workspaceId, ...rest }) => rest); // Remove workspaceId to match API Contract 3.6
  }

  inviteMember(userId: string, wsId: string, dto: InviteMemberDto) {
    // TODO: Use Prisma to check if 'userId' is admin in wsId.
    // TODO: Use Prisma to check if invitee (by email) is already a member (throw 409).
    // TODO: Use Prisma to create the invitation record.
    // TODO: Trigger a Socket.io event 'workspace_invitation_received' to 'user:{inviteeId}'.

    // Mock for API Contract Section 3.7
    const newInvite = {
      id: `inv_${Date.now()}`,
      workspaceId: wsId,
      inviterId: userId,
      inviteeEmail: dto.email,
      role: dto.role,
      status: 'pending',
      createdAt: new Date(),
    };

    this.workspaceInvitations.push(newInvite);
    return newInvite;
  }

  updateMemberRole(
    userId: string,
    wsId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // TODO: Use Prisma to verify 'userId' is an admin in this workspace.
    // TODO: Use Prisma to update the role of the memberId in this wsId.
    // TODO: Trigger a Socket.io event 'member_role_updated' to 'workspace:{wsId}'.

    if (userId !== 'usr_123')
      throw new ForbiddenException('Only admins can change roles');

    const member = this.workspaceMembers.find(
      (m) => m.workspaceId === wsId && m.userId === memberId,
    );

    if (!member) throw new NotFoundException('Member not found');

    if (member.userId === userId && dto.role === 'member') {
      throw new UnprocessableEntityException('Cannot demote yourself');
    }

    member.role = dto.role;
    const { workspaceId: _workspaceId, ...updatedMember } = member;
    return updatedMember; // Match Section 3.10
  }

  removeMember(userId: string, wsId: string, memberId: string) {
    // TODO: Use Prisma to verify 'userId' is an admin OR 'userId' === memberId (leaving).
    // TODO: Use Prisma to delete the WorkspaceMember record.
    // TODO: Trigger a Socket.io event 'member_removed' to 'workspace:{wsId}'.

    const index = this.workspaceMembers.findIndex(
      (m) => m.workspaceId === wsId && m.userId === memberId,
    );

    if (index === -1) throw new NotFoundException('Member not found');
    this.workspaceMembers.splice(index, 1);
  }
}
