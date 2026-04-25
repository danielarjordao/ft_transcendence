import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../interfaces/authenticated-socket.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@WebSocketGateway({
  cors: {
    origin: '*', // Update to specific frontend domain in production
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  // Handle incoming socket connection and enforce JWT authentication.
  async handleConnection(client: AuthenticatedSocket) {
    // <-- 1. Volta a colocar o async aqui
    try {
      const token = client.handshake.query.token as string;

      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }

      // TODO: Remove the hardcoded secret when AuthModule becomes the single source of truth
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'default_dev_secret',
      });

      const userId = payload.sub || payload.id;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      client.data.user = { id: userId };
      const userRoom = `user:${userId}`;

      await client.join(userRoom); // <-- 2. Adiciona o AWAIT aqui!

      this.logger.log(`Client connected: ${client.id} | User: ${userId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown authentication error';

      this.logger.error(
        `Connection rejected: ${client.id} | Reason: ${errorMessage}`,
      );

      // O emit não devolve Promise, por isso não precisa de await
      client.emit('error', {
        type: 'unauthorized',
        message: 'Invalid or missing token',
      });
      client.disconnect();
    }
  }

  // Handle socket disconnection.
  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.user?.id;
    this.logger.log(
      `Client disconnected: ${client.id} | User: ${userId || 'Unknown'}`,
    );
  }
}
