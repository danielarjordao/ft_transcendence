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

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // TODO: [Feature - WebSockets] Emit 'friend_removed' event to 'user:{friendId}'.
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

    // TODO: [Feature - WebSockets] Emit 'friend_request_received' event to 'user:{dto.targetUserId}'.
    return await this.prisma.friendRequest.create({
      data: {
        senderId: userId,
        receiverId: dto.targetUserId,
      },
    });
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

    // TODO: [Feature - WebSockets] Emit 'friend_request_updated' to the original sender.

    // Contract Alignment: Return the strict Friendship object representation,
    // avoiding undocumented custom shapes.
    return {
      userAId: friendship.userAId,
      userBId: friendship.userBId,
      createdAt: friendship.createdAt.toISOString(),
    };
  }
}
