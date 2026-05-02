import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';
import {
  NotificationType,
  WorkspaceInvitationStatus,
  WorkspaceMemberRole,
  type WorkspaceInvitation,
} from '../generated/prisma/client';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../realtime/app.gateway';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';

type InvitationWithRelations = WorkspaceInvitation & {
  workspace?: {
    id: string;
    name: string;
  };
  inviter?: {
    id: string;
    username: string;
    fullName: string | null;
  };
};

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  private getRequiredEnv(name: string, description?: string): string {
    const value = process.env[name];

    if (!value) {
      throw new InternalServerErrorException(
        `${description || name} is not configured`,
      );
    }

    return value;
  }

  private getTokenPepper(): string {
    return this.getRequiredEnv('AUTH_TOKEN_PEPPER', 'Auth token pepper');
  }

  private getInviteExpiresIn(): string {
    return process.env.WORKSPACE_INVITE_EXPIRES_IN || '7d';
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private createInvitationToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashInvitationToken(token: string): string {
    return createHmac('sha256', this.getTokenPepper())
      .update(token)
      .digest('hex');
  }

  private calculateExpiration(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private buildInvitationLink(token: string): string {
    const frontendBaseUrl =
      process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = frontendBaseUrl.replace(/\/$/, '');

    return `${baseUrl}/workspace-invitations/accept?token=${encodeURIComponent(token)}`;
  }

  private isInvitationExpired(invitation: WorkspaceInvitation): boolean {
    return (
      !!invitation.inviteTokenExpiresAt &&
      invitation.inviteTokenExpiresAt.getTime() <= Date.now()
    );
  }

  private formatInvitation(invitation: InvitationWithRelations) {
    return {
      id: invitation.id,
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace?.name ?? null,
      inviterId: invitation.inviterId,
      inviter: invitation.inviter
        ? {
            id: invitation.inviter.id,
            username: invitation.inviter.username,
            fullName: invitation.inviter.fullName,
          }
        : null,
      inviteeId: invitation.inviteeId,
      inviteeEmail: invitation.inviteeEmail,
      role: invitation.role.toLowerCase(),
      status: invitation.status.toLowerCase(),
      createdAt: invitation.createdAt.toISOString(),
      respondedAt: invitation.respondedAt?.toISOString() || null,
      expiresAt: invitation.inviteTokenExpiresAt?.toISOString() || null,
      isExpired: this.isInvitationExpired(invitation),
    };
  }

  private async findInvitationByToken(
    token: string,
  ): Promise<InvitationWithRelations> {
    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        inviteTokenHash: this.hashInvitationToken(token),
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  private async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.normalizeEmail(user.email);
  }

  private async bindPendingInvitationsToUser(userId: string, email: string) {
    await this.prisma.workspaceInvitation.updateMany({
      where: {
        inviteeId: null,
        inviteeEmail: email,
        status: WorkspaceInvitationStatus.PENDING,
        OR: [
          { inviteTokenExpiresAt: null },
          { inviteTokenExpiresAt: { gt: new Date() } },
        ],
      },
      data: {
        inviteeId: userId,
      },
    });
  }

  async create(
    inviterId: string,
    workspaceId: string,
    dto: { email: string; role: string },
  ) {
    const inviterMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: inviterId } },
    });

    if (!inviterMember || inviterMember.role === WorkspaceMemberRole.MEMBER) {
      throw new ForbiddenException('Only Admins or Owners can invite members.');
    }

    const inviteeEmail = this.normalizeEmail(dto.email);
    const [inviteeUser, inviter, workspace] = await Promise.all([
      this.prisma.user.findUnique({
        where: { email: inviteeEmail },
        select: {
          id: true,
        },
      }),
      this.prisma.user.findUnique({
        where: { id: inviterId },
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      }),
      this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
        },
      }),
    ]);

    if (!inviter || !workspace) {
      throw new NotFoundException('Workspace not found or access denied');
    }

    if (inviteeUser) {
      const isAlreadyMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: inviteeUser.id } },
      });

      if (isAlreadyMember) {
        throw new ConflictException('This user is already a workspace member.');
      }
    }

    const pending = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        inviteeEmail,
        status: WorkspaceInvitationStatus.PENDING,
        OR: [
          { inviteTokenExpiresAt: null },
          { inviteTokenExpiresAt: { gt: new Date() } },
        ],
      },
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
    const invitationToken = this.createInvitationToken();
    const invitationTokenHash = this.hashInvitationToken(invitationToken);
    const invitationExpiresAt = this.calculateExpiration(
      this.getInviteExpiresIn(),
    );

    const invitation = await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        inviterId,
        inviteeEmail,
        inviteeId: inviteeUser?.id || null,
        role: assignedRole,
        inviteTokenHash: invitationTokenHash,
        inviteTokenExpiresAt: invitationExpiresAt,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    try {
      await this.mailService.sendWorkspaceInvitationEmail({
        email: inviteeEmail,
        workspaceName: workspace.name,
        inviterName: inviter.fullName || inviter.username,
        role: invitation.role.toLowerCase(),
        invitationLink: this.buildInvitationLink(invitationToken),
        expiresAt: invitationExpiresAt,
      });
    } catch (error) {
      await this.prisma.workspaceInvitation.delete({
        where: { id: invitation.id },
      });
      throw error;
    }

    const formattedInvitation = this.formatInvitation(invitation);

    if (inviteeUser) {
      this.appGateway.server
        .to(`user:${inviteeUser.id}`)
        .emit('workspace_invitation_received', formattedInvitation);

      await this.notificationsService.create(inviteeUser.id, {
        type: NotificationType.WORKSPACE_INVITE,
        title: 'Workspace Invitation',
        message: `You have been invited to join ${workspace.name}.`,
        resource: {
          invitationId: invitation.id,
          workspaceId: invitation.workspaceId,
        },
      });
    }

    return formattedInvitation;
  }

  async previewByToken(token: string) {
    const invitation = await this.findInvitationByToken(token);
    return this.formatInvitation(invitation);
  }

  async claimByToken(userId: string, token: string) {
    const userEmail = await this.getUserEmail(userId);
    const invitation = await this.findInvitationByToken(token);

    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new ConflictException(
        'This invitation has already been responded to',
      );
    }

    if (this.isInvitationExpired(invitation)) {
      throw new ConflictException('Invitation link expired');
    }

    if (this.normalizeEmail(invitation.inviteeEmail) !== userEmail) {
      throw new ForbiddenException(
        'This invitation was sent to a different email address',
      );
    }

    if (invitation.inviteeId && invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }

    const isAlreadyMember = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (isAlreadyMember) {
      throw new ConflictException('This user is already a workspace member.');
    }

    if (invitation.inviteeId === userId) {
      return this.formatInvitation(invitation);
    }

    const claimedInvitation = await this.prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        inviteeId: userId,
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
    });

    return this.formatInvitation(claimedInvitation);
  }

  async findAll(userId: string) {
    const userEmail = await this.getUserEmail(userId);
    await this.bindPendingInvitationsToUser(userId, userEmail);

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: {
        inviteeId: userId,
        status: WorkspaceInvitationStatus.PENDING,
        OR: [
          { inviteTokenExpiresAt: null },
          { inviteTokenExpiresAt: { gt: new Date() } },
        ],
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
          },
        },
        inviter: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((invitation) => this.formatInvitation(invitation));
  }

  async update(
    userId: string,
    invitationId: string,
    updateDto: UpdateWorkspaceInvitationDto,
  ) {
    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.inviteeId !== userId) {
      throw new ForbiddenException('This invitation does not belong to you');
    }

    if (invitation.status !== WorkspaceInvitationStatus.PENDING) {
      throw new ConflictException(
        'This invitation has already been responded to',
      );
    }

    if (this.isInvitationExpired(invitation)) {
      throw new ConflictException('Invitation link expired');
    }

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
        .emit('member_added', {
          userId: result.newMember.userId,
          username: result.newMember.user.username,
          fullName: result.newMember.user.fullName,
          role: result.newMember.role.toLowerCase(),
          status: result.newMember.user.isOnline ? 'online' : 'offline',
        });

      await this.notificationsService.create(invitation.inviterId, {
        type: NotificationType.WORKSPACE_INVITE,
        title: 'Invitation Accepted',
        message: `${result.newMember.user.username} accepted your workspace invitation.`,
        resource: { workspaceId: invitation.workspaceId, newMemberId: userId },
      });
    } else if (updateDto.action === 'decline') {
      await this.notificationsService.create(invitation.inviterId, {
        type: NotificationType.WORKSPACE_INVITE,
        title: 'Invitation Declined',
        message: `Your invitation sent to ${invitation.inviteeEmail} was declined.`,
        resource: { workspaceId: invitation.workspaceId },
      });
    }

    return {
      id: result.updatedInvitation.id,
      workspaceId: result.updatedInvitation.workspaceId,
      workspaceName: null,
      inviterId: result.updatedInvitation.inviterId,
      inviter: null,
      inviteeId: result.updatedInvitation.inviteeId,
      inviteeEmail: result.updatedInvitation.inviteeEmail,
      role: result.updatedInvitation.role.toLowerCase(),
      status: result.updatedInvitation.status.toLowerCase(),
      createdAt: result.updatedInvitation.createdAt.toISOString(),
      respondedAt: result.updatedInvitation.respondedAt?.toISOString() || null,
      expiresAt: result.updatedInvitation.inviteTokenExpiresAt?.toISOString() || null,
      isExpired: this.isInvitationExpired(result.updatedInvitation),
    };
  }
}
