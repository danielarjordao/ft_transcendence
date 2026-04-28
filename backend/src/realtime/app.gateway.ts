import { Logger, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

// The AppGateway acts strictly as the connection manager and security gatekeeper.
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
          .map((url) => url.trim())
          .filter(Boolean)
      : ['http://localhost:5173'],
    credentials: true,
  },
})
export class AppGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AppGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  // Fail-Fast: Ensure critical environment variables are present on startup.
  onModuleInit() {
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error(
        'CRITICAL: JWT_ACCESS_SECRET is not defined in environment variables!',
      );
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const queryToken = client.handshake.query?.token as string;
      const authPayloadToken = client.handshake.auth?.token as string;
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

      // Strict JWT validation
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256'],
      });

      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new UnauthorizedException('Invalid token claims');
      }

      client.data.user = { id: userId };

      // Architectural Requirement: Automatically join the user's global personal room
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
