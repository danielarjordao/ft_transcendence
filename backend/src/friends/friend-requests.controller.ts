import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FriendsService } from './friends.service';
import {
  CreateFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';

@UseGuards(JwtAuthGuard)
@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly friendsService: FriendsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Get()
  listRequests(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.friendsService.listRequests(userId);
  }

  @Post()
  sendRequest(
    @Req() req: RequestWithUser,
    @Body() dto: CreateFriendRequestDto,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.sendRequest(userId, dto);
  }

  @Patch(':id')
  respondRequest(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    const userId = this.getUserId(req);
    return this.friendsService.respondRequest(userId, id, dto);
  }
}
