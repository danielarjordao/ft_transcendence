import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentWithAuthor } from './interfaces/comments-response.type';
import { AppGateway } from '../realtime/app.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../generated/prisma/client';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly appGateway: AppGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

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
    const task = await this.tasksService.findOne(userId, taskId);

    const comment = await this.prisma.comment.create({
      data: { taskId, authorId: userId, text: dto.text },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const formattedComment = this.formatCommentResponse(comment);

    this.appGateway.server
      .to(`workspace:${task.workspaceId}`)
      .emit('comment_added', { taskId, comment: formattedComment });

    // Process mentions in the comment text (e.g., @username)
    const mentionRegex = /(?<=^|\s)@([a-zA-Z0-9_]+)/g;
    const extractedUsernames = Array.from(
      dto.text.matchAll(mentionRegex),
      (m) => m[1],
    );

    // Remove duplicates to avoid multiple notifications for the same user if mentioned multiple times
    const uniqueUsernames = [...new Set(extractedUsernames)];

    if (uniqueUsernames.length > 0) {
      // Find user IDs for the mentioned usernames, excluding the comment author
      const mentionedUsers = await this.prisma.user.findMany({
        where: {
          username: { in: uniqueUsernames },
          id: { not: userId },
        },
        select: { id: true },
      });

      // Create a notification for each mentioned user
      await Promise.all(
        mentionedUsers.map((u) =>
          this.notificationsService.create(u.id, {
            type: NotificationType.MENTION,
            title: 'Nova Menção',
            message: `${formattedComment.author.username} mencionou-te num comentário.`,
            resource: { taskId, commentId: comment.id }, // Contexto rico para o frontend navegar
          }),
        ),
      );
    }
    return formattedComment;
  }

  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { workspaceId: true } } },
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

    const formattedComment = this.formatCommentResponse(updatedComment);

    this.appGateway.server
      .to(`workspace:${existingComment.task.workspaceId}`)
      .emit('comment_updated', {
        taskId: existingComment.taskId,
        comment: formattedComment,
      });

    return formattedComment;
  }

  async remove(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { task: { select: { workspaceId: true } } },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment?.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });

    this.appGateway.server
      .to(`workspace:${comment.task.workspaceId}`)
      .emit('comment_deleted', {
        taskId: comment.taskId,
        commentId: comment.id,
      });
  }
}
