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
    await this.tasksService.findOne(userId, taskId);
    return await this.prisma.attachment.findMany({ where: { taskId } });
  }

  async upload(userId: string, taskId: string, files: Express.Multer.File[]) {
    await this.tasksService.findOne(userId, taskId);

    const data = files.map((file) => ({
      taskId,
      uploaderId: userId,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storageKey: `mock-s3-key-${Date.now()}-${file.originalname}`, // TODO: Upload Real S3
    }));

    await this.prisma.attachment.createMany({ data });

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
    if (!attachment) throw new NotFoundException('Attachment not found');

    await this.tasksService.findOne(userId, attachment.taskId);

    return attachment;
  }

  async remove(userId: string, attachmentId: string) {
    const attachment = await this.getById(userId, attachmentId);

    await this.prisma.attachment.delete({ where: { id: attachment.id } });
  }
}
