import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConversations(userId: string, limit?: number, offset?: number) {
    const partners = await this.prisma.user.findMany({
      where: {
        OR: [
          { sentMessages: { some: { receiverId: userId } } },
          { receivedMessages: { some: { senderId: userId } } },
        ],
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        isOnline: true,
      },
      take: limit ? Number(limit) : 20,
      skip: offset ? Number(offset) : 0,
    });

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

    return conversations.sort(
      (a, b) =>
        (b.lastMessage?.createdAt.getTime() || 0) -
        (a.lastMessage?.createdAt.getTime() || 0),
    );
  }

  async getMessages(
    userId: string,
    friendId: string,
    limit?: number,
    offset?: number,
  ) {
    await this.prisma.message.updateMany({
      where: { senderId: friendId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? Number(limit) : 50,
      skip: offset ? Number(offset) : 0,
    });

    return messages.map(({ id, senderId, text, createdAt, readAt }) => ({
      id,
      senderId,
      text,
      createdAt,
      readAt,
    }));
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: dto.toUserId },
    });
    if (!receiver) throw new NotFoundException('Destinatário não encontrado');

    const newMsg = await this.prisma.message.create({
      data: {
        senderId: userId,
        receiverId: dto.toUserId,
        text: dto.text,
      },
    });

    return {
      id: newMsg.id,
      senderId: newMsg.senderId,
      text: newMsg.text,
      createdAt: newMsg.createdAt,
      readAt: newMsg.readAt,
    };
  }
}
