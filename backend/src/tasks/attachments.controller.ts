import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments-query.dto';

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('tasks/:taskId/attachments')
  listByTask(
    @Param('taskId') taskId: string,
    @Query() _query: ListAttachmentsQueryDto,
  ) {
    return this.attachmentsService.listByTask(taskId);
  }

  @Post('tasks/:taskId/attachments')
  // TODO: Add @UseInterceptors(FilesInterceptor('files')) and @UploadedFiles() to handle multipart/form-data
  upload(@Param('taskId') taskId: string) {
    return this.attachmentsService.upload(taskId);
  }

  @Get('attachments/:attachmentId')
  getById(@Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.getById(attachmentId);
  }

  @Delete('attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('attachmentId') attachmentId: string) {
    return this.attachmentsService.remove(attachmentId);
  }
}
