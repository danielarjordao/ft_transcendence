import { Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from '../interfaces/authenticated-socket.interface';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';
import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { ChatService } from '../chat.service';

@WebSocketGateway({
  cors: {
    // Safely parse FRONTEND_URL to avoid empty string origins
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
          .map((url) => url.trim())
          .filter(Boolean)
      : ['http://localhost:5173'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  // Fail-Fast: Ensure critical environment variables are present on startup.
  onModuleInit() {
    if (!process.env.JWT_ACCESS_SECRET) {
      // Throwing an error allows NestJS to perform a graceful shutdown
      throw new Error(
        'CRITICAL: JWT_ACCESS_SECRET is not defined in environment variables!',
      );
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Support multiple token locations for flexibility in client implementations
      const queryToken = client.handshake.query?.token as string;

      // Extract token from handshake authentication data
      const authPayloadToken = client.handshake.auth?.token as string;

      // Fallback to Authorization header if token is not in handshake auth
      const authHeader = client.handshake.headers.authorization;
      const headerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;

      const token = queryToken || authPayloadToken || headerToken;

      if (!token) {
        throw new UnauthorizedException(
          'Missing authentication token in handshake auth',
        );
      }

      // Strict JWT validation without fallback secrets
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256'],
        // TODO: Consider adding issuer and audience validation for enhanced security
        // issuer: process.env.JWT_ISSUER,
        // audience: process.env.JWT_AUDIENCE,
      });

      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid token claims');
      }

      client.data.user = { id: userId };
      await client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} | User: ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Auth failed';

      this.logger.error(
        `Connection rejected: ${client.id} | Reason: ${errorMessage}`,
      );

      client.emit('auth_error', {
        type: 'unauthorized',
        message: 'Security validation failed',
      });

      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.id;
    this.logger.log(
      `Client disconnected: ${client.id} | User: ${userId || 'Unknown'}`,
    );
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { toUserId: string; text: string },
  ) {
    const fromUserId = client.data?.user?.id;
    if (!fromUserId) return;

    try {
      // Save the message using the ChatService, which also handles validation and error cases
      const savedMessage = await this.chatService.sendMessage(
        fromUserId,
        payload,
      );

      // Emit a message to the receiver's room
      const receiverRoom = `user:${payload.toUserId}`;
      this.server.to(receiverRoom).emit('receive_message', savedMessage);

      // Emit a confirmation back to the sender (optional, but good for UX)
      client.emit('message_sent', savedMessage);

      this.logger.log(`Message sent from ${fromUserId} to ${payload.toUserId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send message: ${errorMessage}`);

      // Notify the sender about the failure without exposing sensitive details
      client.emit('error', { message: 'Could not send message' });
    }
  }
}
