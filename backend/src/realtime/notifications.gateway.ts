import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';

// Encapsulates real-time notification acknowledgement events.
@WebSocketGateway()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  @SubscribeMessage('mark_notification_read')
  handleMarkNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { notificationId: string },
  ) {
    const userId = client.data?.user?.id;
    if (!userId || !payload.notificationId) return;

    // TODO: [Feature - Notifications] Inject NotificationsService to persist status update in database.
    // Implementation: await this.notificationsService.update(userId, payload.notificationId, true);
    this.logger.log(
      `TODO: Mark notification ${payload.notificationId} as read for user ${userId}`,
    );
  }
}
