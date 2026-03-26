import { Controller, Get, Patch, Delete, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // TODO: Replace 'usr_123' with actual authenticated user ID using @GetUser() decorator in all routes

  @Get()
  findAll() {
    return this.notificationsService.findAll('usr_123');
  }

  @Get('unread-count')
  getUnreadCount() {
    return this.notificationsService.getUnreadCount('usr_123');
  }

  @Patch('read-all')
  markAllAsRead() {
    return this.notificationsService.markAllAsRead('usr_123');
  }

  @Patch(':notificationId')
  markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead('usr_123', notificationId);
  }

  @Delete(':notificationId')
  remove(@Param('notificationId') notificationId: string) {
    return this.notificationsService.remove('usr_123', notificationId);
  }
}
