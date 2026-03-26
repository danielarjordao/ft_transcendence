import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  // TODO: Remove this mock array once Prisma is integrated
  private notifications: NotificationDto[] = [
    {
      id: 'notif_1',
      type: 'TASK_ASSIGNED',
      content: 'Foste atribuído à tarefa "Configurar Docker".',
      isRead: false,
      createdAt: new Date(),
      relatedEntityId: 'task_123',
    },
    {
      id: 'notif_2',
      type: 'WORKSPACE_INVITE',
      content: 'Tens um convite para o workspace "Transcendence".',
      isRead: true,
      createdAt: new Date(),
      relatedEntityId: 'ws_456',
    },
  ];

  findAll(userId: string) {
    // TODO: Replace with this.prisma.notification.findMany({ where: { userId } })
    // TODO: Remove this console.log once Prisma is integrated
    console.log(`Fetching notifications for user ${userId}`);
    return this.notifications;
  }

  getUnreadCount(userId: string) {
    // TODO: Replace with this.prisma.notification.count({ where: { userId, isRead: false } })
    // TODO: Remove this console.log once Prisma is integrated
    console.log(`Counting unread notifications for user ${userId}`);
    const count = this.notifications.filter((n) => !n.isRead).length;
    return { unreadCount: count };
  }

  markAllAsRead(userId: string) {
    // TODO: Replace with this.prisma.notification.updateMany({ where: { userId }, data: { isRead: true } })
    // TODO: Remove this console.log once Prisma is integrated
    console.log(`Marking all notifications as read for user ${userId}`);
    this.notifications.forEach((not) => (not.isRead = true));
    return { success: true, message: 'All notifications marked as read' };
  }

  markAsRead(userId: string, notificationId: string) {
    // TODO: Replace with this.prisma.notification.update({ where: { id: notificationId, userId }, data: { isRead: true } })
    const notification = this.notifications.find(
      (not) => not.id === notificationId,
    );
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return notification;
  }

  remove(userId: string, notificationId: string) {
    // TODO: Replace with this.prisma.notification.delete({ where: { id: notificationId, userId } })
    const index = this.notifications.findIndex(
      (not) => not.id === notificationId,
    );
    if (index === -1) {
      throw new NotFoundException('Notification not found');
    }
    this.notifications.splice(index, 1);
    return { success: true, message: 'Notification deleted' };
  }
}
