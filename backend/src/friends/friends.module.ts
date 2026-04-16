import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendRequestsController } from './friend-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FriendsController, FriendRequestsController],
  providers: [FriendsService],
})
export class FriendsModule {}
