import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    // TODO: Pass limit and offset to the service to implement pagination (API Contract Sec 6.1)
    // TODO: Remove console.log and return actual conversations from the database.
    console.log(
      `Fetching conversations for user usr_123 with limit ${limit} and offset ${offset}`,
    );
    return this.chatService.getConversations('usr_123');
  }
  @Get('messages/:friendId')
  getMessages(
    @Param('friendId') friendId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    // TODO: Pass limit and offset to the service to implement pagination (API Contract Sec 6.2)
    // TODO: Remove console.log and return actual messages from the database.
    console.log(
      `Fetching messages between user usr_123 and friend ${friendId} with limit ${limit} and offset ${offset}`,
    );
    return this.chatService.getMessages('usr_123', friendId);
  }

  @Post('messages')
  sendMessage(@Body() dto: SendMessageDto) {
    // TODO: Extract actual userId from the JWT request object (e.g., @Req() req)
    return this.chatService.sendMessage('usr_123', dto);
  }
}
