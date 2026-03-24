import {
  Controller,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listFriends() {
    // TODO: Extract actual userId from the JWT request object
    return this.friendsService.listFriends('usr_123');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Required by API Contract
  removeFriend(@Param('id') id: string) {
    // TODO: Extract actual userId from the JWT request object
    this.friendsService.removeFriend('usr_123', id);
  }
}
