import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';

@Injectable()
export class FriendsService {
  // Mocks moved inside the class to avoid global state leakage
  private mockFriends = [
    {
      id: 'usr_456',
      username: 'lucas_dev',
      fullName: 'Lucas Silva',
      avatarUrl: 'https://github.com/lucas.png',
      status: 'online',
    },
  ];

  private mockRequests = [
    {
      id: 'req_1',
      fromUserId: 'usr_789',
      toUserId: 'usr_123',
      status: 'pending',
    },
  ];

  listFriends(userId: string) {
    // TODO: Use Prisma to fetch accepted friendships where user is part of the relation.
    // TODO: Join with the User table to return lightweight user cards.
    // TODO: Remove this console.log and return real data from the database.
    console.log(`Listing friends for user ${userId}`);
    return this.mockFriends;
  }

  removeFriend(userId: string, friendId: string) {
    // TODO: Use Prisma to delete the friendship relation between userId and friendId.
    // TODO: Emit WebSocket event 'friend_removed' to 'user:{friendId}'.

    this.mockFriends = this.mockFriends.filter(
      (friend) => friend.id !== friendId,
    );
  }

  listRequests(userId: string) {
    // TODO: Use Prisma to fetch pending friend requests where toUserId or fromUserId matches userId.
    // TODO: Remove this console.log and return real data from the database.
    console.log(`Listing friend requests for user ${userId}`);
    return this.mockRequests;
  }

  sendRequest(userId: string, dto: CreateFriendRequestDto) {
    // TODO: Use Prisma to validate if target user exists (Throw 404 if not).
    // TODO: Check if a friendship or pending request already exists (Throw 409 if so).
    // TODO: Save the new friend request in the DB.
    // TODO: Emit WebSocket event 'friend_request_received' to 'user:{dto.targetUserId}'.

    const exists = this.mockRequests.find(
      (request) =>
        request.fromUserId === userId && request.toUserId === dto.targetUserId,
    );
    if (exists) {
      throw new ConflictException('Friend request already exists');
    }

    const newRequest = {
      id: `req_${Date.now()}`,
      fromUserId: userId,
      toUserId: dto.targetUserId,
      status: 'pending',
    };
    this.mockRequests.push(newRequest);

    return newRequest;
  }

  respondRequest(
    userId: string,
    requestId: string,
    dto: RespondFriendRequestDto,
  ) {
    // TODO: Use Prisma to find the request. Ensure toUserId matches the current userId (Security).
    // TODO: If action is 'accept', create a friendship record in the DB and delete the request.
    // TODO: If action is 'reject', simply delete the request.
    // TODO: Emit WebSocket event 'friend_request_updated' to the original sender ('user:{fromUserId}').

    const requestIndex = this.mockRequests.findIndex(
      (request) => request.id === requestId,
    );

    if (requestIndex === -1) {
      throw new NotFoundException('Request not found');
    }

    const request = this.mockRequests[requestIndex];

    if (dto.action === 'accept') {
      // Simulate creating a friendship relation
      this.mockFriends.push({
        id: request.fromUserId,
        username: 'new_friend',
        fullName: 'New Friend',
        avatarUrl: '',
        status: 'online',
      });
    }

    // Remove the friend request from the mock array after responding
    this.mockRequests.splice(requestIndex, 1);

    return { status: dto.action };
  }
}
