import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Get('tasks/:taskId/comments')
  listByTask(@Req() req: RequestWithUser, @Param('taskId') taskId: string) {
    const userId = this.getUserId(req);
    return this.commentsService.listByTask(userId, taskId);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = this.getUserId(req);
    return this.commentsService.create(userId, taskId, createCommentDto);
  }

  @Patch('comments/:commentId')
  update(
    @Req() req: RequestWithUser,
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    const userId = this.getUserId(req);
    return this.commentsService.update(userId, commentId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('commentId') commentId: string) {
    const userId = this.getUserId(req);
    return this.commentsService.remove(userId, commentId);
  }
}
