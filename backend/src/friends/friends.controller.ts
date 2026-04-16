import {
  Controller,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/decorators/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';

@UseGuards(JwtAuthGuard)
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Get()
  listFriends(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.friendsService.listFriends(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFriend(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.friendsService.removeFriend(userId, id);
  }
}
