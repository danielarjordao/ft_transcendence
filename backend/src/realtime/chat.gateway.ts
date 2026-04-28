import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import { ChatService } from '../chat/chat.service';

// Encapsulates all real-time messaging and typing indicators.
@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { toUserId: string; text: string },
  ) {
    const fromUserId = client.data?.user?.id;
    if (!fromUserId) return;

    try {
      const savedMessage = await this.chatService.sendMessage(
        fromUserId,
        payload,
      );
      this.server
        .to(`user:${payload.toUserId}`)
        .emit('receive_message', savedMessage);
      client.emit('message_sent', savedMessage);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send message: ${errorMessage}`);

      client.emit('error', { message: 'Could not send message' });
    }
  }

  @SubscribeMessage('mark_messages_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { fromUserId: string },
  ) {
    const readerId = client.data?.user?.id;
    if (!readerId) return;

    try {
      const readDate = await this.chatService.markMessagesAsRead(
        readerId,
        payload.fromUserId,
      );
      if (readDate) {
        this.server.to(`user:${payload.fromUserId}`).emit('messages_read', {
          byUserId: readerId,
          readAt: readDate,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark messages as read: ${errorMessage}`);
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { toUserId: string },
  ) {
    const fromUserId = client.data?.user?.id;
    if (!fromUserId || !payload.toUserId) return;
    this.server
      .to(`user:${payload.toUserId}`)
      .emit('typing_start', { userId: fromUserId });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { toUserId: string },
  ) {
    const fromUserId = client.data?.user?.id;
    if (!fromUserId || !payload.toUserId) return;
    this.server
      .to(`user:${payload.toUserId}`)
      .emit('typing_stop', { userId: fromUserId });
  }
}
