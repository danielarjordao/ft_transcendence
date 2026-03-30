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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('tasks/:taskId/comments')
  listByTask(@Param('taskId') taskId: string) {
    return this.commentsService.listByTask(taskId);
  }

  @Post('tasks/:taskId/comments')
  create(
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, createCommentDto);
  }

  @Patch('comments/:commentId')
  update(
    @Param('commentId') commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(commentId, updateCommentDto);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('commentId') commentId: string) {
    return this.commentsService.remove(commentId);
  }
}
