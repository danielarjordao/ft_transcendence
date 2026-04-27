import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';
import { AppGateway } from 'src/realtime/app.gateway';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
    private readonly appGateway: AppGateway,
  ) {}

  async listByTask(userId: string, taskId: string) {
    // Security Delegation: Leveraging the TasksService to enforce workspace access rules.
    await this.tasksService.findOne(userId, taskId);
    return await this.prisma.attachment.findMany({ where: { taskId } });
  }

  async upload(userId: string, taskId: string, files: Express.Multer.File[]) {
    const task = await this.tasksService.findOne(userId, taskId);

    // TODO: [Feature - S3 Storage] Implement actual upload logic to an AWS S3 Bucket.
    // Replace this mock mapping with the actual S3 object keys returned by the AWS SDK.
    const data = files.map((file) => ({
      taskId,
      uploaderId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey: `mock-s3-key-${Date.now()}-${file.originalname}`,
    }));

    await this.prisma.attachment.createMany({ data });

    const newAttachments = await this.prisma.attachment.findMany({
      where: { taskId, uploaderId: userId },
      orderBy: { createdAt: 'desc' },
      take: files.length,
    });

    this.appGateway.server
      .to(`workspace:${task.workspaceId}`)
      .emit('attachment_uploaded', {
        taskId,
        attachments: newAttachments,
      });

    return newAttachments;
  }

  async getById(userId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Security Delegation: Verify the user has access to the parent task before returning the file data.
    await this.tasksService.findOne(userId, attachment.taskId);

    return attachment;
  }

  async remove(userId: string, attachmentId: string) {
    const attachment = await this.getById(userId, attachmentId);

    const task = await this.tasksService.findOne(userId, attachment.taskId);

    // TODO: [Feature - S3 Storage] Delete the actual physical file from the S3 Bucket using the storageKey.

    await this.prisma.attachment.delete({ where: { id: attachment.id } });

    this.appGateway.server
      .to(`workspace:${task.workspaceId}`)
      .emit('attachment_deleted', {
        taskId: attachment.taskId,
        attachmentId: attachment.id,
      });
  }
}
