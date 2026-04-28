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

  async create(
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      resource?: Prisma.InputJsonValue;
    },
  ) {
    const notif = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        resource: data.resource === undefined ? Prisma.JsonNull : data.resource,
      },
    });

    const formattedNotif = {
      id: notif.id,
      type: notif.type.toLowerCase(),
      title: notif.title,
      message: notif.message,
      read: notif.isRead,
      resource: notif.resource,
      createdAt: notif.createdAt.toISOString(),
    };

    this.appGateway.server
      .to(`user:${userId}`)
      .emit('notification_received', formattedNotif);

    return formattedNotif;
  }
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
    // Fetch the unread notifications first
    const unreadNotifications = await this.prisma.notification.findMany({
      where: { userId, isRead: false },
    });

    if (unreadNotifications.length === 0) return { updated: true };

    // 2Mark them as read in the database
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    // Emit 'notification_updated' for each modified notification
    for (const n of unreadNotifications) {
      this.appGateway.server.to(`user:${userId}`).emit('notification_updated', {
        id: n.id,
        type: n.type.toLowerCase(),
        title: n.title,
        message: n.message,
        read: true,
        resource: n.resource,
        createdAt: n.createdAt.toISOString(),
      });
    }

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
