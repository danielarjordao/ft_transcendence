import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // TODO: Replace 'usr_123' with actual authenticated user ID using @GetUser() decorator in all routes

  @Get('conversations')
  getConversations() {
    return this.chatService.getConversations('usr_123');
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') conversationId: string) {
    return this.chatService.getMessages('usr_123', conversationId);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatService.sendMessage('usr_123', dto);
  }
}
