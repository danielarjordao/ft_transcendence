import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { ChatService } from './chat.service';
import { AppGateway } from '../realtime/app.gateway';
import { SendMessageDto, ChatQueryDto } from './dto/chat.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

// Verify that the entire controller is protected by the JWT guard to prevent unauthorized access to private messages.
@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly AppGateway: AppGateway,
  ) {}

  // Check that authentication extraction is centralized to enforce Fail-Fast validation.
  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return userId;
  }

  @Get('conversations')
  getConversations(@Req() req: RequestWithUser, @Query() query: ChatQueryDto) {
    const userId = this.getUserId(req);
    return this.chatService.getConversations(userId, query.limit, query.offset);
  }

  @Get('messages/:friendId')
  getMessages(
    @Req() req: RequestWithUser,
    @Param('friendId') friendId: string,
    @Query() query: ChatQueryDto,
  ) {
    const userId = this.getUserId(req);
    return this.chatService.getMessages(
      userId,
      friendId,
      query.limit,
      query.offset,
    );
  }

  @Post('messages')
  async sendMessage(@Req() req: RequestWithUser, @Body() dto: SendMessageDto) {
    const userId = this.getUserId(req);
    const savedMessage = await this.chatService.sendMessage(userId, dto);
    const receiverRoom = `user:${dto.toUserId}`;
    this.AppGateway.server
      .to(receiverRoom)
      .emit('receive_message', savedMessage);
    return savedMessage;
  }
}
