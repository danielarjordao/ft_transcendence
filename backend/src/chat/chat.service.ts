import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';
import { createPaginatedResponse } from '../common/utils/pagination.util';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(
    userId: string,
    limitInput?: number,
    offsetInput?: number,
  ) {
    const limit = limitInput ? Number(limitInput) : 20;
    const offset = offsetInput ? Number(offsetInput) : 0;

    // Architectural Focus: Dynamically construct the bidirectional history lookup.
    // We only fetch users who have actively exchanged messages with the current user.
    const whereClause: Prisma.UserWhereInput = {
      OR: [
        { sentMessages: { some: { receiverId: userId } } },
        { receivedMessages: { some: { senderId: userId } } },
      ],
    };

    // Atomic Transaction: Execute count and fetch operations concurrently to ensure
    // pagination metadata perfectly matches the data slice.
    const [total, partners] = await this.prisma.$transaction([
      this.prisma.user.count({ where: whereClause }),
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          isOnline: true,
        },
        take: limit,
        skip: offset,
      }),
    ]);

    // Data Aggregation: Map through active partners to construct the Conversation Preview Object
    // exactly as demanded by the API.md contract.
    const conversations = await Promise.all(
      partners.map(async (partner) => {
        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partner.id },
              { senderId: partner.id, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, text: true, createdAt: true },
        });

        // Calculate unread badge count for this specific conversation.
        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: partner.id,
            receiverId: userId,
            readAt: null,
          },
        });

        return {
          user: {
            ...partner,
            status: partner.isOnline ? 'online' : 'offline',
          },
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Business Logic: Force chronological sorting so the most recently active conversations bubble to the top.
    const sortedConversations = conversations.sort(
      (a, b) =>
        (b.lastMessage?.createdAt.getTime() || 0) -
        (a.lastMessage?.createdAt.getTime() || 0),
    );

    return createPaginatedResponse(sortedConversations, total, limit, offset);
  }

  async getMessages(
    userId: string,
    friendId: string,
    limitInput?: number,
    offsetInput?: number,
  ) {
    const limit = limitInput ? Number(limitInput) : 50;
    const offset = offsetInput ? Number(offsetInput) : 0;

    // Side-Effect: Opening a conversation inherently means the user has read pending messages.
    // We update this atomically before fetching to ensure the returned payload reflects the 'read' state.
    await this.prisma.message.updateMany({
      where: { senderId: friendId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    // TODO: [Feature - WebSockets] Emit 'notification_updated' or 'read_receipt' to 'user:{friendId}' to clear their unread badges.

    const whereClause: Prisma.MessageWhereInput = {
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    };

    const [total, messages] = await this.prisma.$transaction([
      this.prisma.message.count({ where: whereClause }),
      this.prisma.message.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
    ]);

    // Format projection to match the API.md contract strictly.
    const formattedMessages = messages.map(
      ({ id, senderId, text, createdAt, readAt }) => ({
        id,
        senderId,
        text,
        createdAt,
        readAt,
      }),
    );

    return createPaginatedResponse(formattedMessages, total, limit, offset);
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    // Fail-Fast: Ensure the target user actually exists before attempting to write message data.
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.toUserId },
    });

    if (!receiver) {
      throw new NotFoundException('Target user not found');
    }

    const newMsg = await this.prisma.message.create({
      data: {
        senderId: userId,
        receiverId: dto.toUserId,
        text: dto.text,
      },
    });

    // TODO: [Feature - WebSockets] Emit 'receive_message' event to the 'user:{dto.toUserId}' room.

    return {
      id: newMsg.id,
      senderId: newMsg.senderId,
      text: newMsg.text,
      createdAt: newMsg.createdAt,
      readAt: newMsg.readAt,
    };
  }
}
