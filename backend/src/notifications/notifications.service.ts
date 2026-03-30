import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  // TODO: Remove mock array when Prisma is integrated.
  // Data structure aligned with Section 8 of the API Contract.
  private notifications = [
    {
      id: 'ntf_1',
      type: 'task_assigned',
      title: 'Nova tarefa atribuída',
      message: 'Foste atribuído à tarefa "Configurar Docker".',
      read: false,
      resource: {
        kind: 'task',
        id: 'task_123',
        workspaceId: 'ws_1',
      },
      createdAt: new Date(),
    },
    {
      id: 'ntf_2',
      type: 'workspace_invite',
      title: 'Convite de Workspace',
      message: 'Tens um convite para o workspace "Transcendence".',
      read: true,
      resource: {
        kind: 'workspace',
        id: 'ws_456',
        workspaceId: 'ws_456',
      },
      createdAt: new Date(),
    },
  ];

  findAll(userId: string) {
    // TODO: Use Prisma to fetch notifications for this user (where userId matches).
    // TODO: Implement pagination (limit, offset) and query filters (e.g., ?read=false) based on the API Contract.
    // TODO: Remove console.log and return actual data from the database.
    console.log(`Fetching notifications for user ${userId}`);
    return this.notifications;
  }

  getUnreadCount(userId: string) {
    // TODO: Use Prisma 'count' to get the number of notifications where userId matches and read === false.
    // TODO: Remove console.log and return actual count from the database.
    console.log(`Counting unread notifications for user ${userId}`);
    const count = this.notifications.filter((n) => !n.read).length;
    return { count };
  }

  markAllAsRead(userId: string) {
    // TODO: Use Prisma 'updateMany' to set read = true for all unread notifications belonging to this user.
    // TODO: Remove console.log and perform actual database update.
    console.log(`Marking all notifications as read for user ${userId}`);
    this.notifications.forEach((n) => (n.read = true));
    return { updated: true };
  }

  update(id: string, readStatus: boolean) {
    // TODO: Use Prisma to fetch the notification and verify ownership (notification.userId === userId).
    // TODO: Update the 'read' status in the database.
    const notif = this.notifications.find((n) => n.id === id);
    if (!notif) throw new NotFoundException('Notification not found');

    notif.read = readStatus;
    return notif;
  }

  remove(id: string) {
    // TODO: Use Prisma to fetch the notification and verify ownership (notification.userId === userId).
    // TODO: Delete the record from the database.
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) throw new NotFoundException('Notification not found');

    this.notifications.splice(index, 1);
  }
}
