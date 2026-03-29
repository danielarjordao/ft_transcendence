import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';

type MockAttachment = {
  id: string;
  taskId: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: Date;
};

@Injectable()
export class AttachmentsService {
  private attachments: MockAttachment[] = [];

  constructor(private readonly tasksService: TasksService) {}

  listByTask(taskId: string) {
    this.tasksService.findOne(taskId);
    // TODO: Replace with Prisma findMany — filter by taskId
    return this.attachments.filter((a) => a.taskId === taskId);
  }

  upload(taskId: string, files: Express.Multer.File[]) {
    this.tasksService.findOne(taskId);

    const newAttachments: MockAttachment[] = (files || []).map(
      (file, index) => ({
        id: `att_${Date.now()}_${index}`,
        taskId,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        url: `https://mock-url.com/${file.originalname}`,
        createdAt: new Date(),
      }),
    );

    this.attachments.push(...newAttachments);
    return newAttachments;
  }

  getById(attachmentId: string) {
    // TODO: Search in Prisma by attachmentId, join with task to verify workspace membership (throw 403 if not).
    // TODO: Return attachment metadata + pre-signed URL for download if using S3.
    const attachment = this.attachments.find((a) => a.id === attachmentId);
    if (!attachment)
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    return attachment;
  }

  remove(attachmentId: string) {
    // TODO: Replace with Prisma delete — verify caller is workspace member.
    // TODO: Emit WS event 'attachment_deleted' to 'workspace:{wsId}'.
    const index = this.attachments.findIndex((a) => a.id === attachmentId);
    if (index === -1)
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    this.attachments.splice(index, 1);
  }
}
