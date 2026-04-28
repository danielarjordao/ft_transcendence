import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import type { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import { NotificationsService } from '../notifications/notifications.service';

// Encapsulates real-time notification acknowledgement events.
@WebSocketGateway()
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @SubscribeMessage('mark_notification_read')
  async handleMarkNotificationRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { notificationId: string },
  ) {
    const userId = client.data?.user?.id;
    if (!userId || !payload.notificationId) return;

    try {
      // Mark the notification as read in the database, which will trigger an update event to all clients.
      await this.notificationsService.update(
        userId,
        payload.notificationId,
        true,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark notification as read: ${errorMessage}`);
    }
  }
}
