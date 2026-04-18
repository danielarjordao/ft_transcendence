import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async listByTask(userId: string, taskId: string) {
    // Security Delegation: Leveraging the TasksService to enforce workspace access rules.
    await this.tasksService.findOne(userId, taskId);
    return await this.prisma.attachment.findMany({ where: { taskId } });
  }

  async upload(userId: string, taskId: string, files: Express.Multer.File[]) {
    await this.tasksService.findOne(userId, taskId);

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

    // TODO: [Feature - WebSockets] Emit 'attachment_uploaded' event to the respective workspace room.

    return await this.prisma.attachment.findMany({
      where: { taskId, uploaderId: userId },
      orderBy: { createdAt: 'desc' },
      take: files.length,
    });
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

    // TODO: [Feature - S3 Storage] Delete the actual physical file from the S3 Bucket using the storageKey.

    await this.prisma.attachment.delete({ where: { id: attachment.id } });
  }
}
