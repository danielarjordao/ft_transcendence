import { EventEmitter } from 'events';
import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressInfo } from 'net';
import WebSocket from 'ws';

jest.mock('../src/chat/chat.service', () => ({
  ChatService: class ChatService {},
}));

import { ChatService } from '../src/chat/chat.service';
import { AppGateway } from '../src/realtime/app.gateway';
import { ChatGateway } from '../src/realtime/chat.gateway';
import { WorkspacesGateway } from '../src/realtime/workspaces.gateway';

class RawSocketIoClient extends EventEmitter {
  private socket?: WebSocket;

  constructor(
    private readonly baseUrl: string,
    private readonly token?: string,
  ) {
    super();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL('/socket.io/', this.baseUrl);
      url.searchParams.set('EIO', '4');
      url.searchParams.set('transport', 'websocket');
      if (this.token) {
        url.searchParams.set('token', this.token);
      }

      this.socket = new WebSocket(url);

      this.socket.on('message', (data) => {
        const payload = data.toString();

        if (payload.startsWith('0')) {
          this.socket?.send('40');
          return;
        }

        if (payload === '2') {
          this.socket?.send('3');
          return;
        }

        if (payload.startsWith('40')) {
          this.emit('connected');
          resolve();
          return;
        }

        if (payload === '41') {
          this.emit('socket_disconnected');
          return;
        }

        if (payload.startsWith('42')) {
          const [eventName, body] = JSON.parse(payload.slice(2)) as [
            string,
            unknown,
          ];
          this.emit(eventName, body);
        }
      });

      this.socket.on('close', (code, reason) => {
        this.emit('closed', { code, reason: reason.toString() });
      });

      this.socket.on('error', reject);
    });
  }

  emitEvent(eventName: string, payload: unknown) {
    this.socket?.send(`42${JSON.stringify([eventName, payload])}`);
  }

  waitForEvent<T>(eventName: string, timeoutMs = 1000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for event ${eventName}`));
      }, timeoutMs);

      this.once(eventName, (payload) => {
        clearTimeout(timer);
        resolve(payload as T);
      });
    });
  }

  async disconnect() {
    if (!this.socket) return;
    const socket = this.socket;
    this.socket = undefined;

    if (
      socket.readyState === WebSocket.CLOSING ||
      socket.readyState === WebSocket.CLOSED
    ) {
      return;
    }

    await new Promise<void>((resolve) => {
      socket.once('close', () => resolve());
      socket.close();
    });
  }

  get id() {
    return this.socket?._socket?.remotePort?.toString() ?? 'unknown';
  }
}

describe('Realtime websocket flows (e2e)', () => {
  let app: INestApplication;
  let appGateway: AppGateway;
  let chatGateway: ChatGateway;
  let port: number;
  const clients: RawSocketIoClient[] = [];

  const jwtService = {
    verify: jest.fn(),
  } as unknown as JwtService;

  const chatService = {
    sendMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  } as unknown as ChatService;

  function createClient(token?: string) {
    const client = new RawSocketIoClient(`ws://127.0.0.1:${port}`, token);
    clients.push(client);
    return client;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';

    (jwtService.verify as jest.Mock).mockImplementation((token: string) => {
      if (token === 'token-user-1') return { sub: 'user-1' };
      if (token === 'token-user-2') return { sub: 'user-2' };
      throw new UnauthorizedException('Invalid token');
    });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        ChatGateway,
        WorkspacesGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0, '127.0.0.1');

    port = (app.getHttpServer().address() as AddressInfo).port;
    appGateway = moduleRef.get(AppGateway);
    chatGateway = moduleRef.get(ChatGateway);
  });

  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.disconnect()));
    await app.close();
  });

  it('autentica dois clientes reais e entrega send_message entre salas pessoais', async () => {
    const savedMessage = {
      id: 'message-1',
      senderId: 'user-1',
      text: 'Oi!',
      createdAt: '2026-05-02T05:00:00.000Z',
      readAt: null,
    };
    (chatService.sendMessage as jest.Mock).mockResolvedValue(savedMessage);

    const sender = createClient('token-user-1');
    const receiver = createClient('token-user-2');

    await sender.connect();
    await receiver.connect();

    const senderAckPromise = sender.waitForEvent('message_sent');
    const receiverMessagePromise = receiver.waitForEvent('receive_message');

    sender.emitEvent('send_message', { toUserId: 'user-2', text: 'Oi!' });

    await expect(senderAckPromise).resolves.toEqual(savedMessage);
    await expect(receiverMessagePromise).resolves.toEqual(savedMessage);
    expect(chatService.sendMessage).toHaveBeenCalledWith('user-1', {
      toUserId: 'user-2',
      text: 'Oi!',
    });
  });

  it('rejeita cliente sem token com auth_error e fecha a conexao', async () => {
    const client = createClient();
    const authErrorPromise = client.waitForEvent('auth_error', 2000);
    const disconnectPromise = client.waitForEvent('socket_disconnected', 2000);

    await client.connect();

    await expect(authErrorPromise).resolves.toEqual({
      type: 'unauthorized',
      message: 'Security validation failed',
    });
    await expect(disconnectPromise).resolves.toBeUndefined();
  });

  it('join_workspace coloca o cliente real na room do adapter do socket.io', async () => {
    const client = createClient('token-user-1');

    await client.connect();
    client.emitEvent('join_workspace', { wsId: '42' });
    await new Promise((resolve) => setTimeout(resolve, 30));

    const roomMembers =
      appGateway.server.sockets.adapter.rooms.get('workspace:42');

    expect(roomMembers?.size).toBe(1);
  });

  it('typing_start entrega evento em tempo real para o destinatario autenticado', async () => {
    const sender = createClient('token-user-1');
    const receiver = createClient('token-user-2');

    await sender.connect();
    await receiver.connect();

    const typingPromise = receiver.waitForEvent('typing_start');
    sender.emitEvent('typing_start', { toUserId: 'user-2' });

    await expect(typingPromise).resolves.toEqual({ userId: 'user-1' });
  });

  it('o gateway de chat recebe o servidor real do websocket', () => {
    expect(chatGateway.server).toBeDefined();
  });
});
