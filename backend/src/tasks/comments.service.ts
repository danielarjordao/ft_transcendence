import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { TasksService } from './tasks.service';

type MockComment = {
  id: string;
  taskId: string;
  text: string;
  createdAt: string;
};

@Injectable()
export class CommentsService {
  private comments: MockComment[] = [];

  constructor(private readonly tasksService: TasksService) {}

  listByTask(taskId: string) {
    this.tasksService.findOne(taskId);
    // TODO: Replace with Prisma findMany — filter by taskId, order by createdAt desc
    return this.comments.filter((c) => c.taskId === taskId);
  }

  create(taskId: string, dto: CreateCommentDto) {
    this.tasksService.findOne(taskId);
    // TODO: Replace with Prisma create — verify caller is workspace member.
    // TODO: Emit WS event 'comment_added' to 'workspace:{wsId}'.
    const comment: MockComment = {
      id: `c_${Date.now()}`,
      taskId,
      text: dto.text,
      createdAt: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  update(commentId: string, dto: UpdateCommentDto) {
    // TODO: Replace with Prisma update — verify caller is the comment author (or admin).
    // TODO: Emit WS event 'comment_updated' to 'workspace:{wsId}'.
    const comment = this.comments.find((c) => c.id === commentId);
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    comment.text = dto.text;
    return comment;
  }

  remove(commentId: string) {
    // TODO: Replace with Prisma delete — verify caller is the comment author (or admin).
    // TODO: Emit WS event 'comment_deleted' to 'workspace:{wsId}'.
    const index = this.comments.findIndex((c) => c.id === commentId);
    if (index === -1)
      throw new NotFoundException(`Comment ${commentId} not found`);
    this.comments.splice(index, 1);
  }
}
