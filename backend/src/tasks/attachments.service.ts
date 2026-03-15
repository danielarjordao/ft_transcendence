import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

type MockAttachment = { id: string; taskId: string; url: string };

@Injectable()
export class AttachmentsService {
  private attachments: MockAttachment[] = [];

  constructor(private readonly tasksService: TasksService) {}

  listByTask(taskId: string) {
    this.tasksService.findOne(taskId);
    // TODO: Replace with Prisma findMany — filter by taskId
    return this.attachments.filter((a) => a.taskId === taskId);
  }

  upload(taskId: string) {
    this.tasksService.findOne(taskId);
    // TODO: Implement file upload handling (e.g., using Multer) and storage (e.g., AWS S3, local filesystem, etc.)
    // TODO: Replace with Prisma create — verify caller is workspace member; emit WS event `attachment_added` para workspace:{wsId}
    const attachment: MockAttachment = {
      id: `att_${Date.now()}`,
      taskId,
      url: 'https://mock-url.com/file.pdf',
    };
    this.attachments.push(attachment);
    return [attachment];
  }

  getById(attachmentId: string) {
    // TODO: Search in Prisma by attachmentId, join with task to verify workspace membership (throw 403 if not), return attachment metadata + pre-signed URL for download
    const attachment = this.attachments.find((a) => a.id === attachmentId);
    if (!attachment)
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    return attachment;
  }

  remove(attachmentId: string) {
    // TODO: Replace with Prisma delete — verify caller is workspace member; emit WS event `attachment_deleted`
    const index = this.attachments.findIndex((a) => a.id === attachmentId);
    if (index === -1)
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    this.attachments.splice(index, 1);
  }
}
