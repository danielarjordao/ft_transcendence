import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendRequestsController } from './friend-requests.controller';

@Module({
  controllers: [FriendsController, FriendRequestsController],
  providers: [FriendsService],
})
export class FriendsModule {}
