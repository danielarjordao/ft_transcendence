import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  // TODO: Remove these mock arrays once Prisma is integrated.

  // Data structure aligned with Section 8 (Conversation Preview Object) of the API Contract.
  private conversations = [
    {
      user: {
        id: 'usr_456',
        username: 'lucas_dev',
        fullName: 'Lucas Silva',
        avatarUrl: null,
        status: 'online',
      },
      lastMessage: {
        id: 'msg_2',
        text: 'Já configuraste o Docker?',
        createdAt: new Date(),
      },
      unreadCount: 2,
    },
  ];

  private messages = [
    {
      id: 'm1',
      senderId: 'usr_456',
      receiverId: 'usr_123',
      text: 'Olá a todos no projeto!',
      createdAt: new Date(),
      readAt: new Date(),
    },
    {
      id: 'msg_2',
      senderId: 'usr_123',
      receiverId: 'usr_456',
      text: 'Já configuraste o Docker?',
      createdAt: new Date(),
      readAt: null,
    },
  ];

  getConversations(userId: string) {
    // TODO: Use Prisma to fetch 1:1 conversation previews where userId is a participant.
    // TODO: Group by friend, fetch the latest message for 'lastMessage', and count unread messages for 'unreadCount'.
    // TODO: Apply pagination using limit and offset.
    console.log(`Fetching conversations for user ${userId}`);
    return this.conversations;
  }

  getMessages(userId: string, friendId: string) {
    // TODO: Use Prisma to fetch messages between userId and friendId (using OR conditions).
    // TODO: Order by createdAt and apply pagination (limit, offset).
    return this.messages
      .filter(
        (m) =>
          (m.senderId === userId && m.receiverId === friendId) ||
          (m.senderId === friendId && m.receiverId === userId),
      )
      .map(({ id, senderId, text, createdAt, readAt }) => ({
        id,
        senderId,
        text,
        createdAt,
        readAt,
      })); // Omitting receiverId to match API Contract Section 6.2
  }

  sendMessage(userId: string, dto: SendMessageDto) {
    // TODO: Use Prisma to insert a new message record into the database.
    // TODO: Trigger a Socket.io event ('receive_message') to 'user:{dto.toUserId}' for real-time delivery (API Contract Sec 7.4).
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderId: userId,
      receiverId: dto.toUserId,
      text: dto.text,
      createdAt: new Date(),
      readAt: null,
    };

    this.messages.push(newMsg);

    // Exact return format expected by Section 6.3
    return {
      id: newMsg.id,
      senderId: newMsg.senderId,
      text: newMsg.text,
      createdAt: newMsg.createdAt,
      readAt: newMsg.readAt,
    };
  }
}
