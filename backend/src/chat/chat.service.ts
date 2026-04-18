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

    // Data Aggregation: First fetch the total count for pagination metadata.
    const allPartners = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        isOnline: true,
      },
    });

    // Data Aggregation: Map through active partners to construct the Conversation Preview Object
    // exactly as demanded by the API.md contract.
    const conversations = await Promise.all(
      allPartners.map(async (partner) => {
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
          where: { senderId: partner.id, receiverId: userId, readAt: null },
        });

        const { isOnline, ...cleanPartner } = partner;

        return {
          user: { ...cleanPartner, status: isOnline ? 'online' : 'offline' },
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

    const paginatedSlice = sortedConversations.slice(offset, offset + limit);

    return createPaginatedResponse(
      paginatedSlice,
      sortedConversations.length,
      limit,
      offset,
    );
  }

  async getMessages(
    userId: string,
    friendId: string,
    limitInput?: number,
    offsetInput?: number,
  ) {
    // Contract Alignment: Respect pagination query params, defaulting if absent.
    const limit = limitInput ? Number(limitInput) : 50;
    const offset = offsetInput ? Number(offsetInput) : 0;

    await this.prisma.message.updateMany({
      where: { senderId: friendId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    // TODO: [Feature - WebSockets] Emit 'notification_updated' or 'read_receipt' to 'user:{friendId}'.

    // Fetch as a raw array to match API.md (Section 6.2) while respecting limit/offset.
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      text: m.text,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt ? m.readAt.toISOString() : null,
    }));
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
