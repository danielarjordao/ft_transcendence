import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateFriendRequestDto,
  RespondFriendRequestDto,
} from './dto/friend-request.dto';

// Mocks simulando a base de dados
let MOCK_FRIENDS = [
  {
    id: 'usr_456',
    username: 'lucas_dev',
    fullName: 'Lucas Silva',
    avatarUrl: 'https://github.com/lucas.png',
    status: 'online',
  },
];

const MOCK_REQUESTS = [
  {
    id: 'req_1',
    fromUserId: 'usr_789',
    toUserId: 'usr_123',
    status: 'pending',
  },
];

@Injectable()
export class FriendsService {
  listFriends(userId: string) {
    // TODO: Replace with Prisma - prisma.friendship.findMany (where userId = userId)
    // To avoid unused variable warning for now
    console.log(userId);
    return MOCK_FRIENDS;
  }

  removeFriend(userId: string, friendId: string) {
    // TODO: Prisma - prisma.friendship.delete
    MOCK_FRIENDS = MOCK_FRIENDS.filter((friend) => friend.id !== friendId);
  }

  listRequests(userId: string) {
    // TODO: Prisma - prisma.friendRequest.findMany
    // To avoid unused variable warning for now
    console.log(userId);
    return MOCK_REQUESTS;
  }

  sendRequest(userId: string, dto: CreateFriendRequestDto) {
    // TODO: Prisma - Validate target user exists, check for existing friendship or pending request, then create new friend request
    const exists = MOCK_REQUESTS.find(
      (request) =>
        request.fromUserId === userId && request.toUserId === dto.targetUserId,
    );
    if (exists) throw new ConflictException('Friend request already exists');

    const newRequest = {
      id: `req_${Date.now()}`,
      fromUserId: userId,
      toUserId: dto.targetUserId,
      status: 'pending',
    };
    MOCK_REQUESTS.push(newRequest);
    return newRequest;
  }

  respondRequest(
    userId: string,
    requestId: string,
    dto: RespondFriendRequestDto,
  ) {
    // TODO: Prisma - Update friend request status, and if accepted, create friendship relation
    const requestIndex = MOCK_REQUESTS.findIndex(
      (request) => request.id === requestId,
    );
    if (requestIndex === -1) throw new NotFoundException('Request not found');

    const request = MOCK_REQUESTS[requestIndex];

    if (dto.action === 'accept') {
      // Simulate creating a friendship relation
      MOCK_FRIENDS.push({
        id: request.fromUserId,
        username: 'new_friend',
        fullName: 'New Friend',
        avatarUrl: '',
        status: 'online',
      });
    }

    // Remove the friend request after responding
    MOCK_REQUESTS.splice(requestIndex, 1);

    return { status: dto.action };
  }
}
