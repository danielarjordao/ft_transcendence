import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
jest.mock('../src/common/utils/two-factor', () => ({
  generateTwoFactorSecret: jest.fn(),
  buildTwoFactorOtpAuthUrl: jest.fn(),
  verifyTwoFactorCode: jest.fn(),
}));

jest.mock('../src/prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../src/auth/auth.service', () => ({
  AuthService: class AuthService {},
}));

jest.mock('../src/users/users.service', () => ({
  UsersService: class UsersService {},
}));

jest.mock('../src/account/account.service', () => ({
  AccountService: class AccountService {},
}));

import { AccountController } from '../src/account/account.controller';
import { AccountService } from '../src/account/account.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-1' };
    return true;
  }
}

describe('Auth and Users HTTP flows (e2e)', () => {
  let app: INestApplication<App>;

  const authService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signInWithTwoFactor: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    getOAuth42AuthorizationUrl: jest.fn(),
    getFrontendAuthCallbackUrl: jest.fn(),
    oauth42Callback: jest.fn(),
  };

  const usersService = {
    getMe: jest.fn(),
  };

  const accountService = {
    setup2fa: jest.fn(),
    verify2fa: jest.fn(),
    disable2fa: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    authService.getFrontendAuthCallbackUrl.mockReturnValue(
      'http://localhost:5173/auth/callback',
    );
    authService.getOAuth42AuthorizationUrl.mockImplementation(
      (state: string) => `https://api.intra.42.fr/oauth/authorize?state=${state}`,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [
            {
              ttl: 60000,
              limit: 60,
            },
          ],
        }),
      ],
      controllers: [AuthController, UsersController, AccountController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: UsersService, useValue: usersService },
        { provide: AccountService, useValue: accountService },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(TestJwtAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/auth/sign-up', async () => {
    authService.signUp.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'ana@example.com',
      },
    });

    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({
        email: 'ana@example.com',
        password: 'Senha123',
        fullName: 'Ana Silva',
        username: 'ana.silva',
      })
      .expect(201)
      .expect({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'ana@example.com',
        },
      });
  });

  it('POST /api/auth/sign-in', async () => {
    authService.signIn.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        email: 'ana@example.com',
      },
    });

    await request(app.getHttpServer())
      .post('/api/auth/sign-in')
      .send({
        email: 'ana@example.com',
        password: 'Senha123',
      })
      .expect(200)
      .expect({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'user-1',
          email: 'ana@example.com',
        },
      });
  });

  it('GET /api/users/me com token', async () => {
    usersService.getMe.mockResolvedValue({
      id: 'user-1',
      email: 'ana@example.com',
      username: 'ana.silva',
    });

    await request(app.getHttpServer())
      .get('/api/users/me')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        id: 'user-1',
        email: 'ana@example.com',
        username: 'ana.silva',
      });

    expect(usersService.getMe).toHaveBeenCalledWith('user-1');
  });

  it('POST /api/auth/refresh', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: 'old-refresh-token',
      })
      .expect(200)
      .expect({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
  });

  it('POST /api/auth/logout', async () => {
    authService.logout.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .send({
        refreshToken: 'refresh-token',
      })
      .expect(204);
  });

  it('POST /api/auth/forgot-password', async () => {
    authService.forgotPassword.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({
        email: 'ana@example.com',
      })
      .expect(202);
  });

  it('POST /api/auth/forgot-password respeita rate limit', async () => {
    authService.forgotPassword.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'ana@example.com' })
      .expect(202);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'ana@example.com' })
      .expect(202);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'ana@example.com' })
      .expect(202);
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'ana@example.com' })
      .expect(429)
      .expect({
        type: 'rate_limited',
        message: 'ThrottlerException: Too Many Requests',
        details: null,
      });
  });

  it('POST /api/auth/reset-password', async () => {
    authService.resetPassword.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .send({
        token: 'reset-token',
        newPassword: 'NovaSenha123',
      })
      .expect(204);
  });

  it('POST /api/account/2fa/setup e verify via HTTP', async () => {
    accountService.setup2fa.mockResolvedValue({
      secret: 'secret',
      otpauthUrl: 'otpauth://totp/Fazelo:ana',
      qrCodeDataUrl: 'data:image/png;base64,qr',
    });
    accountService.verify2fa.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .post('/api/account/2fa/setup')
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({
        secret: 'secret',
        otpauthUrl: 'otpauth://totp/Fazelo:ana',
        qrCodeDataUrl: 'data:image/png;base64,qr',
      });

    await request(app.getHttpServer())
      .post('/api/account/2fa/verify')
      .set('Authorization', 'Bearer access-token')
      .send({
        code: '123456',
      })
      .expect(204);
  });

  it('GET /api/auth/42 redireciona para a 42 e define cookie de state', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/42')
      .expect(302);

    expect(response.headers.location).toContain(
      'https://api.intra.42.fr/oauth/authorize?state=',
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('oauth42_state='),
      ]),
    );
  });

  it('GET /api/auth/42/callback rejeita state invalido e redireciona com erro', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/42/callback')
      .query({
        code: 'oauth-code',
        state: 'wrong-state',
      })
      .set('Cookie', ['oauth42_state=expected-state'])
      .expect(302);

    expect(response.headers.location).toBe(
      'http://localhost:5173/auth/callback?error=oauth_state',
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('oauth42_state=;'),
      ]),
    );
    expect(authService.oauth42Callback).not.toHaveBeenCalled();
  });

  it('GET /api/auth/42/callback com state valido seta cookies e redireciona', async () => {
    authService.oauth42Callback.mockResolvedValue({
      accessToken: 'oauth-access-token',
      refreshToken: 'oauth-refresh-token',
      user: {
        id: 'user-42',
        email: 'oauth@example.com',
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/auth/42/callback')
      .query({
        code: 'oauth-code',
        state: 'expected-state',
      })
      .set('Cookie', ['oauth42_state=expected-state'])
      .expect(302);

    expect(authService.oauth42Callback).toHaveBeenCalledWith(
      'oauth-code',
      expect.objectContaining({
        ipAddress: expect.any(String),
      }),
    );
    expect(response.headers.location).toBe(
      'http://localhost:5173/auth/callback',
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('accessToken=oauth-access-token'),
        expect.stringContaining('refreshToken=oauth-refresh-token'),
        expect.stringContaining('oauth42_state=;'),
      ]),
    );
  });

  it('valida payload invalido antes de chegar no service', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up')
      .send({
        email: 'ana@example.com',
        password: '123',
        fullName: 'Ana Silva',
        username: 'ana.silva',
      })
      .expect(400)
      .expect({
        type: 'validation_error',
        message: 'The request payload is invalid.',
        details: {
          field: 'password must be longer than or equal to 8 characters',
        },
      });

    expect(authService.signUp).not.toHaveBeenCalled();
  });
});
