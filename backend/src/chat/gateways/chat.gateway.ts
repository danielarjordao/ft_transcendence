import { Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';
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

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Fail-Fast: Ensure critical environment variables are present on startup.
   */
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
      const token = client.handshake.auth?.token as string;

      if (!token) {
        throw new UnauthorizedException(
          'Missing authentication token in handshake auth',
        );
      }

      // Strict JWT validation without fallback secrets
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
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
}
