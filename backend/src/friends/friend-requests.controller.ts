import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { FriendsService } from './friends.service';
import {
  CreateFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';

@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listRequests() {
    return this.friendsService.listRequests('usr_123');
  }

  @Post()
  sendRequest(@Body() dto: CreateFriendRequestDto) {
    return this.friendsService.sendRequest('usr_123', dto);
  }

  @Patch(':id')
  respondRequest(
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
  ) {
    return this.friendsService.respondRequest('usr_123', id, dto);
  }
}
