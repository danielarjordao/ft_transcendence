import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // GET /tasks/:taskId/comments (API 5.6)
  @Get('tasks/:taskId/comments')
  listByTask(@Param('taskId') taskId: string) {
    return this.commentsService.listByTask(taskId);
  }

  // POST /tasks/:taskId/comments (API 5.7)
  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, createCommentDto);
  }

  // PATCH /comments/:commentId (API 5.8)
  @Patch('comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, updateCommentDto);
  }

  // DELETE /comments/:commentId (API 5.9)
  @Delete('comments/:commentId')
  @HttpCode(204)
  remove(@Param('commentId') commentId: string) {
    return this.commentsService.remove(commentId);
  }
}
