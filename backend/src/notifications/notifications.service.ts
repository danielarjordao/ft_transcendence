import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, NotificationType } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { createPaginatedResponse } from '../common/utils/pagination.util';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';
import { AppGateway } from 'src/realtime/app.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  // Note: Creation of notifications is not handled here. Architecturally, notifications
  // should be generated as side-effects by other modules (e.g., TasksService, FriendsService).

  async findAll(userId: string, query: ListNotificationsQueryDto) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    // Safe dynamic query construction based on API contract filters
    const whereClause: Prisma.NotificationWhereInput = {
      userId,
    };

    if (query.type) {
      whereClause.type = query.type.toUpperCase() as NotificationType;
    }

    if (query.read !== undefined) {
      whereClause.isRead = query.read === 'true';
    }

    const [total, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where: whereClause }),
      this.prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    const formattedNotifications = notifications.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      message: n.message,
      read: n.isRead,
      resource: n.resource,
      createdAt: n.createdAt,
    }));

    return createPaginatedResponse(
      formattedNotifications,
      total,
      limit,
      offset,
    );
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.appGateway.server
      .to(`user:${userId}`)
      .emit('notifications_cleared', { clearedAt: new Date().toISOString() });

    return { updated: true };
  }

  async update(userId: string, id: string, readStatus: boolean) {
    // Fail-Fast: Verify the resource exists.
    const notif = await this.prisma.notification.findUnique({ where: { id } });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    // Security Check: Verify absolute ownership before permitting mutation.
    if (notif.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }

    const updatedNotif = await this.prisma.notification.update({
      where: { id },
      data: { isRead: readStatus },
    });

    const formattedNotif = {
      id: updatedNotif.id,
      type: updatedNotif.type.toLowerCase(),
      title: updatedNotif.title,
      message: updatedNotif.message,
      read: updatedNotif.isRead,
      resource: updatedNotif.resource,
      createdAt: updatedNotif.createdAt,
    };

    this.appGateway.server
      .to(`user:${userId}`)
      .emit('notification_updated', formattedNotif);

    return formattedNotif;
  }

  async remove(userId: string, id: string) {
    // Fail-Fast: Verify the resource exists.
    const notif = await this.prisma.notification.findUnique({ where: { id } });

    if (!notif) {
      throw new NotFoundException('Notification not found');
    }

    // Security Check: Verify absolute ownership before permitting deletion.
    if (notif.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.prisma.notification.delete({ where: { id } });

    this.appGateway.server
      .to(`user:${userId}`)
      .emit('notification_deleted', { id });
  }
}
