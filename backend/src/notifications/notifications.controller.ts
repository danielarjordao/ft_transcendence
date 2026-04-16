import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/decorators/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationDto } from './dto/notification.dto';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Get()
  findAll(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.notificationsService.findAll(userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id')
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    const userId = this.getUserId(req);
    return this.notificationsService.update(userId, id, dto.read);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.notificationsService.remove(userId, id);
  }
}
