import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import { encryptSecret } from '../common/utils/secret-crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const verifyTwoFactorCodeMock = jest.fn();

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../generated/prisma/client', () => ({
  SessionStatus: {
    ACTIVE: 'ACTIVE',
    REVOKED: 'REVOKED',
  },
}));

jest.mock('../generated/prisma/enums', () => ({
  AuthProvider: {
    LOCAL: 'LOCAL',
    FORTY_TWO: 'FORTY_TWO',
  },
}));

jest.mock('../common/utils/two-factor', () => ({
  verifyTwoFactorCode: (...args) => verifyTwoFactorCodeMock(...args),
}));

const SESSION_STATUS = {
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
} as const;

const AUTH_PROVIDER = {
  LOCAL: 'LOCAL',
  FORTY_TWO: 'FORTY_TWO',
} as const;

function hashToken(token: string): string {
  return createHmac('sha256', process.env.AUTH_TOKEN_PEPPER || 'dev_pepper')
    .update(token)
    .digest('hex');
}

describe('AuthService', () => {
  let service: AuthService;

  const prisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    authAccount: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as unknown as PrismaService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const mailService = {
    sendPasswordResetEmail: jest.fn(),
  } as unknown as MailService;

  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma, jwtService, mailService);

    process.env.AUTH_TOKEN_PEPPER = 'test-pepper';
    process.env.AUTH_ENCRYPTION_KEY = Buffer.alloc(32, 1).toString('base64');
    process.env.PASSWORD_RESET_FRONTEND_URL =
      'http://localhost:5173/reset-password';
    process.env.FORTY_TWO_CLIENT_ID = 'forty-two-client-id';
    process.env.FORTY_TWO_CLIENT_SECRET = 'forty-two-client-secret';
    process.env.FORTY_TWO_CALLBACK_URL =
      'https://localhost:3000/api/auth/42/callback';
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('signup cria usuario com senha hasheada e sessao persistida', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'user-1',
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      bio: null,
      avatarUrl: null,
      accountType: 'standard',
    }));
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    prisma.session.create.mockResolvedValue({ id: 'session-1' });

    const result = await service.signUp(
      {
        email: 'ana@example.com',
        password: 'Senha123',
        fullName: 'Ana Silva',
        username: 'ana.silva',
      },
      {
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
      },
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'ana@example.com',
        fullName: 'Ana Silva',
        username: 'ana.silva',
        bio: '',
        avatarUrl: null,
        accountType: 'standard',
      },
    });

    const createPayload = prisma.user.create.mock.calls[0][0].data;
    expect(createPayload.authAccounts.create.provider).toBe('LOCAL');
    expect(createPayload.authAccounts.create.passwordHash).not.toBe('Senha123');
    await expect(
      bcrypt.compare('Senha123', createPayload.authAccounts.create.passwordHash),
    ).resolves.toBe(true);

    expect(prisma.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: hashToken('refresh-token'),
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
      }),
    });
  });

  it('signup nao permite email ou username duplicado', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'existing-user' })
      .mockResolvedValueOnce(null);

    await expect(
      service.signUp({
        email: 'ana@example.com',
        password: 'Senha123',
        fullName: 'Ana Silva',
        username: 'ana.silva',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('signin rejeita senha errada', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      authAccounts: [
        {
          id: 'auth-1',
          passwordHash: await bcrypt.hash('Senha123', 10),
        },
      ],
    });

    await expect(
      service.signIn({
        email: 'ana@example.com',
        password: 'SenhaErrada',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
  });

  it('signin com 2FA habilitado retorna token intermediario', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      username: 'ana',
      fullName: 'Ana',
      bio: null,
      avatarUrl: null,
      accountType: 'standard',
      twoFactorEnabled: true,
      twoFactorSecretEnc: 'encrypted-secret',
      authAccounts: [
        {
          id: 'auth-1',
          passwordHash: await bcrypt.hash('Senha123', 10),
        },
      ],
    });
    (jwtService.signAsync as jest.Mock).mockResolvedValueOnce('2fa-token');

    await expect(
      service.signIn({
        email: 'ana@example.com',
        password: 'Senha123',
      }),
    ).resolves.toEqual({
      requiresTwoFactor: true,
      twoFactorToken: '2fa-token',
    });

    expect(prisma.session.create).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('signinWithTwoFactor valida codigo e retorna tokens finais', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      purpose: '2fa',
    });
    verifyTwoFactorCodeMock.mockResolvedValue(true);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      username: 'ana',
      fullName: 'Ana',
      bio: null,
      avatarUrl: null,
      accountType: 'standard',
      twoFactorEnabled: true,
      twoFactorSecretEnc: encryptSecret('two-factor-secret'),
    });
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    prisma.session.create.mockResolvedValue({ id: 'session-1' });
    prisma.user.update.mockResolvedValue({});

    await expect(
      service.signInWithTwoFactor(
        {
          twoFactorToken: '2fa-token',
          code: '123456',
        },
        {
          userAgent: 'jest',
          ipAddress: '127.0.0.1',
        },
      ),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'ana@example.com',
        fullName: 'Ana',
        username: 'ana',
        bio: '',
        avatarUrl: null,
        accountType: 'standard',
      },
    });
  });

  it('signinWithTwoFactor rejeita codigo invalido', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      purpose: '2fa',
    });
    verifyTwoFactorCodeMock.mockResolvedValue(false);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      twoFactorEnabled: true,
      twoFactorSecretEnc: encryptSecret('two-factor-secret'),
    });

    await expect(
      service.signInWithTwoFactor({
        twoFactorToken: '2fa-token',
        code: '000000',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid two-factor code'));
  });

  it('refresh rejeita token invalido', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(
      service.refresh({ refreshToken: 'refresh-invalido' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
  });

  it('refresh rejeita refresh token antigo apos rotacao', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'ana@example.com',
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      status: SESSION_STATUS.REVOKED,
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.refresh({ refreshToken: 'old-refresh-token' }),
    ).rejects.toThrow(new UnauthorizedException('Invalid refresh token'));
  });

  it('refresh rotaciona refresh token e revoga a sessao antiga', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'ana@example.com',
    });
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      status: SESSION_STATUS.ACTIVE,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      userAgent: 'jest',
      ipAddress: '127.0.0.1',
    });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
    });
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const tx = {
      session: {
        create: jest.fn().mockResolvedValue({ id: 'session-2' }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.refresh({ refreshToken: 'old-refresh-token' }),
    ).resolves.toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    expect(tx.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        refreshTokenHash: hashToken('new-refresh-token'),
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
      }),
    });
    expect(tx.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        status: SESSION_STATUS.REVOKED,
        replacedBySessionId: 'session-2',
      }),
    });
  });

  it('logout revoga sessao ativa', async () => {
    prisma.session.findUnique.mockResolvedValue({
      id: 'session-1',
      status: SESSION_STATUS.ACTIVE,
      revokedAt: null,
    });
    prisma.session.update.mockResolvedValue({});

    await expect(
      service.logout({ refreshToken: 'refresh-token' }),
    ).resolves.toBeUndefined();

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { id: 'session-1' },
      data: expect.objectContaining({
        status: SESSION_STATUS.REVOKED,
      }),
    });
  });

  it('forgotPassword nao revela se email existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'ghost@example.com' }),
    ).resolves.toBeUndefined();

    expect(prisma.authAccount.findUnique).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgotPassword salva hash do token e envia email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
    });
    prisma.authAccount.findUnique.mockResolvedValue({
      id: 'auth-1',
      userId: 'user-1',
      provider: AUTH_PROVIDER.LOCAL,
    });

    const tx = {
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: 'prt-1' }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await service.forgotPassword({ email: 'ana@example.com' });

    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
    const [email, link] = (mailService.sendPasswordResetEmail as jest.Mock).mock
      .calls[0];

    expect(email).toBe('ana@example.com');
    const resetToken = new URL(link).searchParams.get('token');
    expect(resetToken).toBeTruthy();
    expect(tx.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: hashToken(resetToken as string),
      }),
    });
  });

  it('resetPassword troca senha e invalida token/sessoes', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'prt-1',
      userId: 'user-1',
      tokenHash: hashToken('reset-token'),
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prisma.authAccount.findUnique.mockResolvedValue({
      id: 'auth-1',
      userId: 'user-1',
      provider: AUTH_PROVIDER.LOCAL,
    });

    const tx = {
      authAccount: {
        update: jest.fn().mockResolvedValue({}),
      },
      user: {
        update: jest.fn().mockResolvedValue({}),
      },
      passwordResetToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      session: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'NovaSenha123',
      }),
    ).resolves.toBeUndefined();

    const newHash = tx.authAccount.update.mock.calls[0][0].data.passwordHash;
    await expect(bcrypt.compare('NovaSenha123', newHash)).resolves.toBe(true);
    expect(tx.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        usedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    });
    expect(tx.session.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        status: SESSION_STATUS.ACTIVE,
        revokedAt: null,
      },
      data: {
        status: SESSION_STATUS.REVOKED,
        revokedAt: expect.any(Date),
      },
    });
  });

  it('resetPassword rejeita token expirado', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'prt-1',
      userId: 'user-1',
      tokenHash: hashToken('reset-token'),
      usedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'NovaSenha123',
      }),
    ).rejects.toThrow(new UnauthorizedException('Reset token expired'));
  });

  it('resetPassword rejeita token ja usado', async () => {
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: 'prt-1',
      userId: 'user-1',
      tokenHash: hashToken('reset-token'),
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.resetPassword({
        token: 'reset-token',
        newPassword: 'NovaSenha123',
      }),
    ).rejects.toThrow('Reset token not found');
  });

  it('oauth42Callback troca code por token, busca perfil e cria sessao local', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'provider-access-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 42,
          email: 'oauth@example.com',
          login: 'oauth_user',
          displayname: 'OAuth User',
          image: {
            link: 'https://cdn.example.com/avatar.png',
          },
        }),
      });

    global.fetch = fetchMock as typeof fetch;

    prisma.authAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-42',
      email: 'oauth@example.com',
      username: 'oauth_user',
      fullName: 'OAuth User',
      bio: null,
      avatarUrl: 'https://cdn.example.com/avatar.png',
      accountType: 'oauth_42',
    });
    prisma.authAccount.create.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({ id: 'session-42' });
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(
      service.oauth42Callback('oauth-code', {
        userAgent: 'jest',
        ipAddress: '127.0.0.1',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-42',
        email: 'oauth@example.com',
        fullName: 'OAuth User',
        username: 'oauth_user',
        bio: '',
        avatarUrl: 'https://cdn.example.com/avatar.png',
        accountType: 'oauth_42',
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(prisma.authAccount.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-42',
        provider: AUTH_PROVIDER.FORTY_TWO,
        providerAccountId: '42',
        providerEmail: 'oauth@example.com',
        scope: 'public',
      },
    });
    expect(prisma.session.create).toHaveBeenCalled();
  });
});
