import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  // TODO: Remove these mock arrays once Prisma is integrated
  private conversations = [
    { id: 'conv_1', name: 'Geral', type: 'CHANNEL', unreadCount: 0 },
    { id: 'conv_2', name: 'João (Colega)', type: 'DM', unreadCount: 2 },
  ];

  private messages = [
    {
      id: 'msg_1',
      conversationId: 'conv_1',
      senderId: 'usr_2',
      content: 'Olá a todos no projeto!',
      createdAt: new Date(),
    },
    {
      id: 'msg_2',
      conversationId: 'conv_2',
      senderId: 'usr_3',
      content: 'Já configuraste o Docker?',
      createdAt: new Date(),
    },
  ];

  getConversations(userId: string) {
    // TODO: Replace with this.prisma.conversation.findMany({ where: { participants: { some: { id: userId } } } })
    // TODO: Remove this console.log once Prisma is integrated
    console.log(`Fetching conversations for user ${userId}`);
    return this.conversations;
  }

  getMessages(userId: string, conversationId: string) {
    // TODO: Replace with this.prisma.message.findMany({ where: { conversationId } })
    return this.messages.filter((m) => m.conversationId === conversationId);
  }

  sendMessage(userId: string, dto: SendMessageDto) {
    // TODO: Replace with this.prisma.message.create({ data: { ... } })
    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId: dto.channelId || dto.receiverId || 'conv_nova',
      senderId: userId,
      content: dto.content,
      createdAt: new Date(),
    };

    this.messages.push(newMsg);
    return newMsg;
  }
}
