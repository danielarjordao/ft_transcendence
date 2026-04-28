import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';

// Encapsulates room assignment logic for Kanban collaboration.
@WebSocketGateway()
export class WorkspacesGateway {
  private readonly logger = new Logger(WorkspacesGateway.name);

  @SubscribeMessage('join_workspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { wsId: string },
  ) {
    if (!payload.wsId) return;
    const roomName = `workspace:${payload.wsId}`;
    await client.join(roomName);
    this.logger.log(`User ${client.data.user?.id} joined ${roomName}`);
  }

  @SubscribeMessage('leave_workspace')
  async handleLeaveWorkspace(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { wsId: string },
  ) {
    if (!payload.wsId) return;
    const roomName = `workspace:${payload.wsId}`;
    await client.leave(roomName);
    this.logger.log(`User ${client.data.user?.id} left ${roomName}`);
  }
}
