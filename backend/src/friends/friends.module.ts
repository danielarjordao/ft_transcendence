import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendRequestsController } from './friend-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  // Registering both controllers ensures they share the same singleton instance of FriendsService.
  controllers: [FriendsController, FriendRequestsController],
  providers: [FriendsService],
})
export class FriendsModule {}
