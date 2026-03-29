import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('notifications')
  findAll() {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    return this.notificationsService.findAll('usr_123');
  }

  @Get('notifications/unread-count')
  getUnreadCount() {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    return this.notificationsService.getUnreadCount('usr_123');
  }

  @Patch('notifications/read-all')
  markAllAsRead() {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    return this.notificationsService.markAllAsRead('usr_123');
  }

  @Patch('notifications/:id')
  update(@Param('id') id: string, @Body('read') read: boolean) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    // TODO: Pass the userId to the service to ensure ownership validation
    return this.notificationsService.update(id, read);
  }

  // Added to match API Contract Section 6.8 (204 No Content instead of 200 OK)
  @Delete('notifications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    // TODO: Pass the userId to the service to ensure ownership validation
    this.notificationsService.remove(id);
  }
}
