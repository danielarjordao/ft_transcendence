import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../realtime/app.gateway';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;

  const emitMock = jest.fn();
  const toMock = jest.fn(() => ({ emit: emitMock }));

  const prisma = {
    workspaceMember: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
    },
    workspaceInvitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const appGateway = {
    server: {
      to: toMock,
    },
  } as unknown as AppGateway;

  const notificationsService = {
    create: jest.fn(),
  } as unknown as NotificationsService;

  const mailService = {
    sendWorkspaceInvitationEmail: jest.fn(),
  } as unknown as MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AUTH_TOKEN_PEPPER = 'workspace-invite-pepper';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.WORKSPACE_INVITE_EXPIRES_IN = '7d';

    service = new InvitationsService(
      prisma,
      appGateway,
      notificationsService,
      mailService,
    );
  });

  it('create gera convite seguro e dispara email', async () => {
    prisma.workspaceMember.findUnique.mockImplementation(({ where }) => {
      if (where.workspaceId_userId?.userId === 'inviter-1') {
        return Promise.resolve({ role: 'OWNER' });
      }

      return Promise.resolve(null);
    });

    prisma.user.findUnique.mockImplementation(({ where }) => {
      if (where.email) {
        return Promise.resolve({ id: 'invitee-1' });
      }

      if (where.id === 'inviter-1') {
        return Promise.resolve({
          id: 'inviter-1',
          username: 'ana',
          fullName: 'Ana Silva',
        });
      }

      return Promise.resolve(null);
    });

    prisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Fazelo Core',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue(null);
    prisma.workspaceInvitation.create.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: 'invitee-1',
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });

    const result = await service.create('inviter-1', 'ws-1', {
      email: 'Invitee@Example.com',
      role: 'member',
    });

    expect(prisma.workspaceInvitation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workspaceId: 'ws-1',
        inviterId: 'inviter-1',
        inviteeEmail: 'invitee@example.com',
        inviteeId: 'invitee-1',
        inviteTokenHash: expect.any(String),
        inviteTokenExpiresAt: expect.any(Date),
      }),
      include: expect.any(Object),
    });
    expect(mailService.sendWorkspaceInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'invitee@example.com',
        workspaceName: 'Fazelo Core',
        inviterName: 'Ana Silva',
        role: 'member',
        invitationLink: expect.stringMatching(
          /^http:\/\/localhost:5173\/workspace-invitations\/accept\?token=/,
        ),
      }),
    );
    expect(emitMock).toHaveBeenCalledWith(
      'workspace_invitation_received',
      expect.objectContaining({
        id: 'inv-1',
        workspaceName: 'Fazelo Core',
        inviteeEmail: 'invitee@example.com',
      }),
    );
    expect(notificationsService.create).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        id: 'inv-1',
        workspaceName: 'Fazelo Core',
        inviteeEmail: 'invitee@example.com',
        status: 'pending',
      }),
    );
  });

  it('create falha se o convidante nao tiver permissao administrativa', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

    await expect(
      service.create('inviter-1', 'ws-1', {
        email: 'invitee@example.com',
        role: 'member',
      }),
    ).rejects.toThrow(
      new ForbiddenException('Only Admins or Owners can invite members.'),
    );
  });

  it('create falha se ja existir convite pendente para o mesmo email', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      });
    prisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Fazelo Core',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue({
      id: 'existing-inv',
    });

    await expect(
      service.create('inviter-1', 'ws-1', {
        email: 'invitee@example.com',
        role: 'member',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'A pending invitation already exists for this email.',
      ),
    );
  });

  it('create remove o convite se o envio do email falhar', async () => {
    prisma.workspaceMember.findUnique.mockResolvedValue({ role: 'OWNER' });
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      });
    prisma.workspace.findUnique.mockResolvedValue({
      id: 'ws-1',
      name: 'Fazelo Core',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue(null);
    prisma.workspaceInvitation.create.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: null,
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });
    (mailService.sendWorkspaceInvitationEmail as jest.Mock).mockRejectedValue(
      new Error('smtp down'),
    );

    await expect(
      service.create('inviter-1', 'ws-1', {
        email: 'invitee@example.com',
        role: 'member',
      }),
    ).rejects.toThrow('smtp down');

    expect(prisma.workspaceInvitation.delete).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
    });
  });

  it('claimByToken vincula convite pendente ao usuario autenticado com email correspondente', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'invitee@example.com',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: null,
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });
    prisma.workspaceMember.findUnique.mockResolvedValue(null);
    prisma.workspaceInvitation.update.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: 'user-1',
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });

    const result = await service.claimByToken('user-1', 'secure-token');

    expect(prisma.workspaceInvitation.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: {
        inviteeId: 'user-1',
      },
      include: expect.any(Object),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'inv-1',
        inviteeId: 'user-1',
        status: 'pending',
      }),
    );
  });

  it('claimByToken falha se o email autenticado nao bate com o convite', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'other@example.com',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: null,
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });

    await expect(
      service.claimByToken('user-1', 'secure-token'),
    ).rejects.toThrow(
      new ForbiddenException(
        'This invitation was sent to a different email address',
      ),
    );
  });

  it('claimByToken falha se o convite estiver expirado', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'invitee@example.com',
    });
    prisma.workspaceInvitation.findFirst.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: null,
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-01T12:00:00.000Z'),
      workspace: { id: 'ws-1', name: 'Fazelo Core' },
      inviter: {
        id: 'inviter-1',
        username: 'ana',
        fullName: 'Ana Silva',
      },
    });

    await expect(
      service.claimByToken('user-1', 'secure-token'),
    ).rejects.toThrow(new ConflictException('Invitation link expired'));
  });

  it('findAll vincula convites pendentes pelo email antes de listar', async () => {
    prisma.user.findUnique.mockResolvedValue({
      email: 'invitee@example.com',
    });
    prisma.workspaceInvitation.findMany.mockResolvedValue([
      {
        id: 'inv-1',
        workspaceId: 'ws-1',
        inviterId: 'inviter-1',
        inviteeId: 'user-1',
        inviteeEmail: 'invitee@example.com',
        role: 'MEMBER',
        status: 'PENDING',
        createdAt: new Date('2026-05-02T12:00:00.000Z'),
        respondedAt: null,
        inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
        workspace: { id: 'ws-1', name: 'Fazelo Core' },
        inviter: {
          id: 'inviter-1',
          username: 'ana',
          fullName: 'Ana Silva',
        },
      },
    ]);

    const result = await service.findAll('user-1');

    expect(prisma.workspaceInvitation.updateMany).toHaveBeenCalledWith({
      where: {
        inviteeId: null,
        inviteeEmail: 'invitee@example.com',
        status: 'PENDING',
        OR: [
          { inviteTokenExpiresAt: null },
          { inviteTokenExpiresAt: { gt: expect.any(Date) } },
        ],
      },
      data: {
        inviteeId: 'user-1',
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'inv-1',
        workspaceName: 'Fazelo Core',
      }),
    );
  });

  it('update bloqueia aceite de convite expirado', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: 'user-1',
      inviteeEmail: 'invitee@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-01T12:00:00.000Z'),
    });

    await expect(
      service.update('user-1', 'inv-1', { action: 'accept' }),
    ).rejects.toThrow(new ConflictException('Invitation link expired'));
  });

  it('update aceita convite e emite member_added', async () => {
    prisma.workspaceInvitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      inviterId: 'inviter-1',
      inviteeId: 'user-1',
      inviteeEmail: 'invitee@example.com',
      role: 'ADMIN',
      status: 'PENDING',
      createdAt: new Date('2026-05-02T12:00:00.000Z'),
      respondedAt: null,
      inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
    });
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        workspaceInvitation: {
          update: jest.fn().mockResolvedValue({
            id: 'inv-1',
            workspaceId: 'ws-1',
            inviterId: 'inviter-1',
            inviteeId: 'user-1',
            inviteeEmail: 'invitee@example.com',
            role: 'ADMIN',
            status: 'ACCEPTED',
            createdAt: new Date('2026-05-02T12:00:00.000Z'),
            respondedAt: new Date('2026-05-02T12:10:00.000Z'),
            inviteTokenExpiresAt: new Date('2026-05-09T12:00:00.000Z'),
          }),
        },
        workspaceMember: {
          create: jest.fn().mockResolvedValue({
            userId: 'user-1',
            role: 'ADMIN',
            user: {
              id: 'user-1',
              username: 'invitee',
              fullName: 'Invitee User',
              isOnline: true,
            },
          }),
        },
      }),
    );

    const result = await service.update('user-1', 'inv-1', {
      action: 'accept',
    });

    expect(emitMock).toHaveBeenCalledWith('member_added', {
      userId: 'user-1',
      username: 'invitee',
      fullName: 'Invitee User',
      role: 'admin',
      status: 'online',
    });
    expect(notificationsService.create).toHaveBeenCalledWith('inviter-1', {
      type: 'WORKSPACE_INVITE',
      title: 'Invitation Accepted',
      message: 'invitee accepted your workspace invitation.',
      resource: { workspaceId: 'ws-1', newMemberId: 'user-1' },
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'inv-1',
        status: 'accepted',
        role: 'admin',
      }),
    );
  });
});
