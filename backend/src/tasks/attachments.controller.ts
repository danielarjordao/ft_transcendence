import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('files'))
  upload(
    @Param('taskId') taskId: string,
    @UploadedFiles() files: Express.Multer.File[], // <-- Alterar aqui
  ) {
    return this.attachmentsService.upload(taskId, files);
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
