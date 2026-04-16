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

    return await this.prisma.comment.create({
      data: {
        taskId,
        authorId: userId,
        text: dto.text,
      },
    });
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (comment?.authorId !== userId)
      throw new ForbiddenException('Not your comment');

    return await this.prisma.comment.update({
      where: { id: commentId },
      data: { text: dto.text },
    });
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (comment?.authorId !== userId)
      throw new ForbiddenException('Not your comment');

    await this.prisma.comment.delete({ where: { id: commentId } });
  }
}
