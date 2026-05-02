import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { InvitationsController } from '../src/workspaces/invitations.controller';
import { InvitationsService } from '../src/workspaces/invitations.service';

class TestJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = { id: 'user-1' };
    return true;
  }
}

describe('Workspace invitations HTTP flows (e2e)', () => {
  let app: INestApplication<App>;

  const invitationsService = {
    previewByToken: jest.fn(),
    findAll: jest.fn(),
    claimByToken: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        { provide: InvitationsService, useValue: invitationsService },
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

  it('GET /api/workspace-invitations/preview', async () => {
    invitationsService.previewByToken.mockResolvedValue({
      id: 'inv-1',
      workspaceId: 'ws-1',
      status: 'pending',
    });

    await request(app.getHttpServer())
      .get('/api/workspace-invitations/preview')
      .query({ token: 'invite-token' })
      .expect(200)
      .expect({
        id: 'inv-1',
        workspaceId: 'ws-1',
        status: 'pending',
      });

    expect(invitationsService.previewByToken).toHaveBeenCalledWith(
      'invite-token',
    );
  });

  it('GET /api/workspace-invitations/preview valida token obrigatorio', async () => {
    await request(app.getHttpServer())
      .get('/api/workspace-invitations/preview')
      .expect(400)
      .expect({
        type: 'validation_error',
        message: 'The request payload is invalid.',
        details: {
          field: 'token should not be empty',
        },
      });
  });

  it('GET /api/workspace-invitations', async () => {
    invitationsService.findAll.mockResolvedValue([
      {
        id: 'inv-1',
        workspaceId: 'ws-1',
      },
    ]);

    await request(app.getHttpServer())
      .get('/api/workspace-invitations')
      .expect(200)
      .expect([
        {
          id: 'inv-1',
          workspaceId: 'ws-1',
        },
      ]);

    expect(invitationsService.findAll).toHaveBeenCalledWith('user-1');
  });

  it('POST /api/workspace-invitations/claim', async () => {
    invitationsService.claimByToken.mockResolvedValue({
      id: 'inv-1',
      inviteeId: 'user-1',
      status: 'pending',
    });

    await request(app.getHttpServer())
      .post('/api/workspace-invitations/claim')
      .send({ token: 'invite-token' })
      .expect(200)
      .expect({
        id: 'inv-1',
        inviteeId: 'user-1',
        status: 'pending',
      });

    expect(invitationsService.claimByToken).toHaveBeenCalledWith(
      'user-1',
      'invite-token',
    );
  });

  it('POST /api/workspace-invitations/claim valida token obrigatorio', async () => {
    await request(app.getHttpServer())
      .post('/api/workspace-invitations/claim')
      .send({})
      .expect(400)
      .expect({
        type: 'validation_error',
        message: 'The request payload is invalid.',
        details: {
          field: 'token should not be empty',
        },
      });
  });

  it('PATCH /api/workspace-invitations/:invitationId valida action', async () => {
    await request(app.getHttpServer())
      .patch('/api/workspace-invitations/inv-1')
      .send({ action: 'maybe' })
      .expect(400)
      .expect({
        type: 'validation_error',
        message: 'The request payload is invalid.',
        details: {
          field: 'Action must be either accept or decline',
        },
      });
  });
});
