import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';
import { AppGateway } from '../realtime/app.gateway';

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appGateway: AppGateway,
  ) {}

  private sortIds(
    id1: string,
    id2: string,
  ): { userAId: string; userBId: string } {
    return id1 < id2
      ? { userAId: id1, userBId: id2 }
      : { userAId: id2, userBId: id1 };
  }

  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isOnline: true,
          },
        },
        userB: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            isOnline: true,
          },
        },
      },
    });

    return friendships.map((f) => {
      const friend = f.userAId === userId ? f.userB : f.userA;
      return {
        id: friend.id,
        username: friend.username,
        fullName: friend.fullName,
        avatarUrl: friend.avatarUrl,
        status: friend.isOnline ? 'online' : 'offline',
      };
    });
  }

  async removeFriend(userId: string, friendId: string) {
    const { userAId, userBId } = this.sortIds(userId, friendId);

    await this.prisma.friendship.deleteMany({
      where: { userAId, userBId },
    });

    this.appGateway.server
      .to(`user:${friendId}`)
      .emit('friend_removed', { userId });
  }

  async listRequests(userId: string) {
    return await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async sendRequest(userId: string, dto: CreateFriendRequestDto) {
    if (userId === dto.targetUserId) {
      throw new UnprocessableEntityException(
        'You cannot send a friend request to yourself',
      );
    }

    const targetExists = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
    });
    if (!targetExists) throw new NotFoundException('Target user not found');

    const { userAId, userBId } = this.sortIds(userId, dto.targetUserId);

    const alreadyFriends = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });
    if (alreadyFriends) throw new ConflictException('You are already friends');

    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: dto.targetUserId },
          { senderId: dto.targetUserId, receiverId: userId },
        ],
      },
    });
    if (existingRequest)
      throw new ConflictException(
        'A friend request already exists between you two',
      );

    const newRequest = await this.prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: dto.targetUserId,
      },
    });

    this.appGateway.server
      .to(`user:${dto.targetUserId}`)
      .emit('friend_request_received', newRequest);

    return newRequest;
  }

  async respondRequest(
    userId: string,
    requestId: string,
    dto: RespondFriendRequestDto,
  ) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new NotFoundException('Friend request not found');

    // Security Check: Only the receiver can accept or reject the request.
    if (request.receiverId !== userId) {
      throw new ForbiddenException(
        'You can only respond to requests sent to you',
      );
    }

    if (dto.action === 'reject') {
      await this.prisma.friendRequest.delete({ where: { id: requestId } });

      // Alert the sender that their request was rejected
      this.appGateway.server
        .to(`user:${request.senderId}`)
        .emit('friend_request_updated', {
          id: request.id,
          senderId: request.senderId,
          receiverId: request.receiverId,
          status: 'rejected',
          createdAt: request.createdAt.toISOString(),
        });

      return { status: 'rejected' };
    }

    const { userAId, userBId } = this.sortIds(
      request.senderId,
      request.receiverId,
    );

    // Atomic Transaction: Finalize the request while establishing the friendship.
    await this.prisma.$transaction(async (tx) => {
      await tx.friendRequest.delete({ where: { id: requestId } });

      await tx.friendship.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        update: {},
        create: { userAId, userBId },
      });
    });

    const friendship = await this.prisma.friendship.findUnique({
      where: { userAId_userBId: { userAId, userBId } },
    });

    if (!friendship) {
      throw new NotFoundException('Friendship could not be established');
    }

    const friendshipResponse = {
      userAId: friendship.userAId,
      userBId: friendship.userBId,
      createdAt: friendship.createdAt.toISOString(),
    };

    // Alert the sender that their request was accepted and provide the new friendship details
    this.appGateway.server
      .to(`user:${request.senderId}`)
      .emit('friend_request_updated', {
        id: request.id,
        senderId: request.senderId,
        receiverId: request.receiverId,
        status: 'accepted',
        createdAt: request.createdAt.toISOString(),
      });

    return friendshipResponse;
  }

  // Real-time Presence Updates: Notify friends when a user goes online or offline.
  async notifyPresenceChange(userId: string, status: 'online' | 'offline') {
    const friendships = await this.prisma.friendship.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
    });

    for (const f of friendships) {
      const friendId = f.userAId === userId ? f.userBId : f.userAId;
      this.appGateway.server
        .to(`user:${friendId}`)
        .emit('friend_presence_changed', { userId, status });
    }
  }
}
