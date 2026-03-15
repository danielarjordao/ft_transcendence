import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments-query.dto';

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  // GET /tasks/:taskId/attachments (API 5.10)
  @Get('tasks/:taskId/attachments')
  listByTask(
    @Param('taskId') taskId: string,
    @Query() _query: ListAttachmentsQueryDto,
  ) {
    return this.attachmentsService.listByTask(taskId);
  }

  // POST /tasks/:taskId/attachments (API 5.11)
  @Post('tasks/:taskId/attachments')
  upload(@Param('taskId') taskId: string) {
    return this.attachmentsService.upload(taskId);
  }

  // GET /attachments/:attachmentId (API 5.12)
  @Get('attachments/:attachmentId')
  getById(@Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.getById(attachmentId);
  }

  // DELETE /attachments/:attachmentId (API 5.13)
  @Delete('attachments/:attachmentId')
  @HttpCode(204)
  remove(@Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.remove(attachmentId);
  }
}
