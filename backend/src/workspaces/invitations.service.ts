import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';
import {
  WorkspaceInvitationStatus,
  WorkspaceMemberRole,
} from '../generated/prisma/client';
import { AppGateway } from 'src/realtime/app.gateway';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  async create(
    inviterId: string,
    workspaceId: string,
    dto: { email: string; role: string },
  ) {
    // Security check: Enforce Admin/Owner privileges.
    const inviterMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } },
    });

    if (!inviterMember || inviterMember.role === 'MEMBER') {
      throw new ForbiddenException('Only Admins or Owners can invite members.');
    }

    // Fail-Fast: Prevent inviting users who are already in the workspace.
    const inviteeUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (inviteeUser) {
      const isAlreadyMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: inviteeUser.id } },
      });
      if (isAlreadyMember) {
        throw new ConflictException('This user is already a workspace member.');
      }
    }

    // Fail-Fast: Prevent spamming duplicate invitations.
    const pending = await this.prisma.workspaceInvitation.findFirst({
      where: { workspaceId, inviteeEmail: dto.email, status: 'PENDING' },
    });

    if (pending) {
      throw new ConflictException(
        'A pending invitation already exists for this email.',
      );
    }

    const assignedRole =
      dto.role.toUpperCase() === 'ADMIN'
        ? WorkspaceMemberRole.ADMIN
        : WorkspaceMemberRole.MEMBER;

    const result = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        inviterId,
        inviteeEmail: dto.email,
        inviteeId: inviteeUser?.id || null,
        role: assignedRole,
      },
    });

    // TODO: [Feature - Emails] Dispatch an email via Nodemailer/SendGrid to 'dto.email' containing a secure join link.

    const formattedInvitation = {
      id: result.id,
      workspaceId: result.workspaceId,
      inviterId: result.inviterId,
      inviteeEmail: result.inviteeEmail,
      role: result.role.toLowerCase(),
      status: result.status.toLowerCase(),
      createdAt: result.createdAt.toISOString(),
    };

    if (inviteeUser) {
      this.appGateway.server
        .to(`user:${inviteeUser.id}`)
        .emit('invitation_received', formattedInvitation);
    }
    // Architectural Focus: Normalizing the response to match Section 3.7 of API.md
    return formattedInvitation;
  }

  async findAll(userId: string) {
    return await this.prisma.workspaceInvitation.findMany({
      where: {
        inviteeId: userId,
        status: WorkspaceInvitationStatus.PENDING,
      },
      include: {
        workspace: { select: { name: true } },
        inviter: { select: { fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(
    userId: string,
    invitationId: string,
    updateDto: UpdateWorkspaceInvitationDto,
  ) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }
    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new ConflictException(
        'This invitation has already been responded to',
      );
    }

    // Atomic Transaction: Guarantee status change and membership creation succeed or fail together.
    const result = await this.prisma.$transaction(async (tx) => {
      const newStatus =
        updateDto.action === 'accept'
          ? WorkspaceInvitationStatus.ACCEPTED
          : WorkspaceInvitationStatus.DECLINED;

      const updatedInvitation = await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: newStatus,
          respondedAt: new Date(),
        },
      });

      if (newStatus === WorkspaceInvitationStatus.ACCEPTED) {
        const targetRole =
          invitation.role === 'ADMIN'
            ? WorkspaceMemberRole.ADMIN
            : WorkspaceMemberRole.MEMBER;

        const newMember = await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: userId,
            role: targetRole,
          },
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

        return { updatedInvitation, newMember };
      }

      return { updatedInvitation, newMember: null };
    });

    if (updateDto.action === 'accept' && result.newMember) {
      this.appGateway.server
        .to(`workspace:${invitation.workspaceId}`)
        .emit('member_joined', {
          userId: result.newMember.userId,
          username: result.newMember.user.username,
          fullName: result.newMember.user.fullName,
          role: result.newMember.role.toLowerCase(),
          status: result.newMember.user.isOnline ? 'online' : 'offline',
        });
    }

    // Explicit mapping to decouple DB enums from the API contract.
    return {
      id: result.updatedInvitation.id,
      workspaceId: result.updatedInvitation.workspaceId,
      inviterId: result.updatedInvitation.inviterId,
      inviteeEmail: result.updatedInvitation.inviteeEmail,
      role: result.updatedInvitation.role.toLowerCase(),
      status: result.updatedInvitation.status.toLowerCase(),
      createdAt: result.updatedInvitation.createdAt.toISOString(),
    };
  }
}
