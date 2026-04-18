import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async listByTask(userId: string, taskId: string) {
    // Security Delegation: Verify workspace access via the parent task.
    await this.tasksService.findOne(userId, taskId);

    return await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    await this.tasksService.findOne(userId, taskId);

    const comment = await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        text: dto.text,
      },
    });

    // TODO: [Feature - WebSockets] Emit 'comment_created' event to the respective workspace room.
    // TODO: [Feature - Notifications] Trigger an internal notification for users tagged in the comment text.

    return comment;
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    // Absolute Security: Enforce strict ownership. Users cannot edit others' comments.
    if (comment?.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return await this.prisma.comment.update({
      where: { id: commentId },
      data: { text: dto.text },
    });
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment?.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
