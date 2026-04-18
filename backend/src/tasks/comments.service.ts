import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentWithAuthor } from './interfaces/comments-response.type';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  // Fim do erro "any"! Agora tem tipagem estrita.
  private formatCommentResponse(comment: CommentWithAuthor) {
    return {
      id: comment.id,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatarUrl: comment.author.avatarUrl,
      },
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async listByTask(userId: string, taskId: string) {
    await this.tasksService.findOne(userId, taskId);

    const comments = await this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    return comments.map((c) => this.formatCommentResponse(c));
  }

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    await this.tasksService.findOne(userId, taskId);

    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, text: dto.text },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // TODO: [Feature - WebSockets] Emit 'comment_added' event to the respective workspace room.
    // TODO: [Feature - Notifications] Trigger an internal notification for users tagged in the comment text.

    return this.formatCommentResponse(comment);
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (existingComment?.authorId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { text: dto.text },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // TODO: [Feature - WebSockets] Emit 'comment_updated' event to the respective workspace room.

    return this.formatCommentResponse(updatedComment);
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (comment?.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const _deletedComment = await this.prisma.comment.delete({
      where: { id: commentId },
    });

    // TODO: [Feature - WebSockets] Emit 'comment_deleted' event to the workspace room.
  }
}
