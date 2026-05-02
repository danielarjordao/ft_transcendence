import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AppGateway } from './app.gateway';
import { ChatGateway } from './chat.gateway';
import { WorkspacesGateway } from './workspaces.gateway';
import { ChatService } from '../chat/chat.service';

jest.mock('../chat/chat.service', () => ({
  ChatService: class ChatService {},
}));

describe('Realtime integration', () => {
  let appGateway: AppGateway;
  let chatGateway: ChatGateway;
  let workspacesGateway: WorkspacesGateway;

  const jwtService = {
    verify: jest.fn(),
  } as unknown as JwtService;

  const chatService = {
    sendMessage: jest.fn(),
    markMessagesAsRead: jest.fn(),
  } as unknown as ChatService;

  const roomEmitter = {
    emit: jest.fn(),
  };

  const server = {
    to: jest.fn().mockReturnValue(roomEmitter),
  };

  function createClient(token?: string) {
    return {
      id: 'socket-1',
      handshake: {
        query: token ? { token } : {},
      },
      data: {},
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    } as any;
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        ChatGateway,
        WorkspacesGateway,
        { provide: JwtService, useValue: jwtService },
        { provide: ChatService, useValue: chatService },
      ],
    }).compile();

    appGateway = moduleRef.get(AppGateway);
    chatGateway = moduleRef.get(ChatGateway);
    workspacesGateway = moduleRef.get(WorkspacesGateway);

    chatGateway.server = server as any;
  });

  it('autentica o socket e permite send_message com roteamento para a sala pessoal do destinatario', async () => {
    const savedMessage = {
      id: 'message-1',
      fromUserId: 'user-1',
      toUserId: 'user-2',
      text: 'Oi!',
    };
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    (chatService.sendMessage as jest.Mock).mockResolvedValue(savedMessage);
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    await chatGateway.handleSendMessage(client, {
      toUserId: 'user-2',
      text: 'Oi!',
    });

    expect(client.data.user).toEqual({ id: 'user-1' });
    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(chatService.sendMessage).toHaveBeenCalledWith('user-1', {
      toUserId: 'user-2',
      text: 'Oi!',
    });
    expect(server.to).toHaveBeenCalledWith('user:user-2');
    expect(roomEmitter.emit).toHaveBeenCalledWith(
      'receive_message',
      savedMessage,
    );
    expect(client.emit).toHaveBeenCalledWith('message_sent', savedMessage);
  });

  it('usa o contexto autenticado do socket para typing_start', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    chatGateway.handleTypingStart(client, { toUserId: 'user-2' });

    expect(server.to).toHaveBeenCalledWith('user:user-2');
    expect(roomEmitter.emit).toHaveBeenCalledWith('typing_start', {
      userId: 'user-1',
    });
  });

  it('usa o contexto autenticado do socket para mark_messages_read', async () => {
    const readDate = new Date('2026-05-02T03:00:00.000Z');
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    (chatService.markMessagesAsRead as jest.Mock).mockResolvedValue(readDate);
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    await chatGateway.handleMarkAsRead(client, { fromUserId: 'user-2' });

    expect(chatService.markMessagesAsRead).toHaveBeenCalledWith(
      'user-1',
      'user-2',
    );
    expect(server.to).toHaveBeenCalledWith('user:user-2');
    expect(roomEmitter.emit).toHaveBeenCalledWith('messages_read', {
      byUserId: 'user-1',
      readAt: readDate,
    });
  });

  it('permite join e leave de workspace para socket autenticado', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    await workspacesGateway.handleJoinWorkspace(client, { wsId: '42' });
    await workspacesGateway.handleLeaveWorkspace(client, { wsId: '42' });

    expect(client.join).toHaveBeenCalledWith('workspace:42');
    expect(client.leave).toHaveBeenCalledWith('workspace:42');
  });

  it('nao processa send_message quando o socket nao esta autenticado', async () => {
    const client = createClient();

    await chatGateway.handleSendMessage(client, {
      toUserId: 'user-2',
      text: 'Oi!',
    });

    expect(chatService.sendMessage).not.toHaveBeenCalled();
    expect(server.to).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('send_message emite evento de erro quando o service falha', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    (chatService.sendMessage as jest.Mock).mockRejectedValue(
      new Error('db down'),
    );
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    await chatGateway.handleSendMessage(client, {
      toUserId: 'user-2',
      text: 'Oi!',
    });

    expect(server.to).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('error', {
      message: 'Could not send message',
    });
  });

  it('typing_stop emite para a sala do destinatario', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    chatGateway.handleTypingStop(client, { toUserId: 'user-2' });

    expect(server.to).toHaveBeenCalledWith('user:user-2');
    expect(roomEmitter.emit).toHaveBeenCalledWith('typing_stop', {
      userId: 'user-1',
    });
  });

  it('typing_start sem toUserId nao emite', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    chatGateway.handleTypingStart(client, { toUserId: '' });

    expect(server.to).not.toHaveBeenCalled();
  });

  it('typing_stop sem autenticacao nao emite', () => {
    const client = createClient();

    chatGateway.handleTypingStop(client, { toUserId: 'user-2' });

    expect(server.to).not.toHaveBeenCalled();
  });

  it('mark_messages_read nao emite quando readDate eh null', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    (chatService.markMessagesAsRead as jest.Mock).mockResolvedValue(null);
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    await chatGateway.handleMarkAsRead(client, { fromUserId: 'user-2' });

    expect(chatService.markMessagesAsRead).toHaveBeenCalled();
    expect(server.to).not.toHaveBeenCalled();
  });

  it('mark_messages_read engole erro do service', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    (chatService.markMessagesAsRead as jest.Mock).mockRejectedValue(
      new Error('db down'),
    );
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);

    await expect(
      chatGateway.handleMarkAsRead(client, { fromUserId: 'user-2' }),
    ).resolves.toBeUndefined();
    expect(server.to).not.toHaveBeenCalled();
  });

  it('mark_messages_read sem autenticacao nao chama service', async () => {
    const client = createClient();

    await chatGateway.handleMarkAsRead(client, { fromUserId: 'user-2' });

    expect(chatService.markMessagesAsRead).not.toHaveBeenCalled();
  });

  it('join_workspace sem wsId nao chama join', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);
    client.join.mockClear();

    await workspacesGateway.handleJoinWorkspace(client, { wsId: '' });

    expect(client.join).not.toHaveBeenCalled();
  });

  it('leave_workspace sem wsId nao chama leave', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1' });
    const client = createClient('valid-token');

    await appGateway.handleConnection(client);

    await workspacesGateway.handleLeaveWorkspace(client, { wsId: '' });

    expect(client.leave).not.toHaveBeenCalled();
  });
});
