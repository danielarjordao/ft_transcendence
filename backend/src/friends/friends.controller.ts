import { Controller, Get, Delete, Param } from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listFriends() {
    return this.friendsService.listFriends('usr_123'); // Hardcoded user por agora
  }

  @Delete(':id')
  removeFriend(@Param('id') id: string) {
    this.friendsService.removeFriend('usr_123', id);
  }
}
