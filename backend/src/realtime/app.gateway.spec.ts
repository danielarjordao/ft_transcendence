import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';

describe('AppGateway', () => {
  const jwtService = {
    verify: jest.fn(),
  } as unknown as JwtService;

  let gateway: AppGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new AppGateway(jwtService);
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  });

  it('falha no onModuleInit sem JWT_ACCESS_SECRET', () => {
    delete process.env.JWT_ACCESS_SECRET;

    expect(() => gateway.onModuleInit()).toThrow(
      'CRITICAL: JWT_ACCESS_SECRET is not defined in environment variables!',
    );
  });

  it('aceita conexao valida, popula user e entra na sala pessoal', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = {
      id: 'socket-1',
      handshake: {
        query: { token: 'access-token' },
      },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(jwtService.verify).toHaveBeenCalledWith('access-token', {
      secret: 'test-access-secret',
      algorithms: ['HS256'],
    });
    expect(client.data.user).toEqual({ id: 'user-1' });
    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(client.emit).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('aceita conexao valida usando payload.id quando sub nao existe', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ id: 'user-2' });
    const client = {
      id: 'socket-1b',
      handshake: {
        query: { token: 'access-token' },
      },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(jwtService.verify).toHaveBeenCalledWith('access-token', {
      secret: 'test-access-secret',
      algorithms: ['HS256'],
    });
    expect(client.data.user).toEqual({ id: 'user-2' });
    expect(client.join).toHaveBeenCalledWith('user:user-2');
    expect(client.emit).not.toHaveBeenCalled();
    expect(client.disconnect).not.toHaveBeenCalled();
  });

  it('rejeita conexao sem token e emite auth_error', async () => {
    const client = {
      id: 'socket-2',
      handshake: {
        query: {},
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('auth_error', {
      type: 'unauthorized',
      message: 'Security validation failed',
    });
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('rejeita conexao quando o JWT nao contem sub nem id', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({});
    const client = {
      id: 'socket-2b',
      handshake: {
        query: { token: 'access-token' },
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(client.join).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('auth_error', {
      type: 'unauthorized',
      message: 'Security validation failed',
    });
    expect(client.disconnect).toHaveBeenCalled();
  });

  it('rejeita conexao quando o JWT e invalido', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedException('Invalid token');
    });
    const client = {
      id: 'socket-3',
      handshake: {
        query: { token: 'invalid-token' },
      },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;

    await gateway.handleConnection(client);

    expect(client.emit).toHaveBeenCalledWith('auth_error', {
      type: 'unauthorized',
      message: 'Security validation failed',
    });
    expect(client.disconnect).toHaveBeenCalled();
  });
});
