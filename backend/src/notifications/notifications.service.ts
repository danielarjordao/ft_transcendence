import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => ({
      id: n.id,
      type: n.type.toLowerCase(),
      title: n.title,
      message: n.message,
      read: n.isRead,
      resource: n.resource,
      createdAt: n.createdAt,
    }));
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

    return { updated: true };
  }

  async update(userId: string, id: string, readStatus: boolean) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });

    if (!notif) throw new NotFoundException('Notification not found');

    if (notif.userId !== userId) {
      throw new ForbiddenException(
        'You can only update your own notifications',
      );
    }

    const updatedNotif = await this.prisma.notification.update({
      where: { id },
      data: { isRead: readStatus },
    });

    return {
      id: updatedNotif.id,
      type: updatedNotif.type.toLowerCase(),
      title: updatedNotif.title,
      message: updatedNotif.message,
      read: updatedNotif.isRead,
      resource: updatedNotif.resource,
      createdAt: updatedNotif.createdAt,
    };
  }

  async remove(userId: string, id: string) {
    const notif = await this.prisma.notification.findUnique({ where: { id } });

    if (!notif) throw new NotFoundException('Notification not found');

    if (notif.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own notifications',
      );
    }

    await this.prisma.notification.delete({ where: { id } });
  }
}
