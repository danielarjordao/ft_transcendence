import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';
import { ListAttachmentsQueryDto } from './dto/list-attachments-query.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return userId;
  }

  @Get('tasks/:taskId/attachments')
  listByTask(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @Query() _query: ListAttachmentsQueryDto,
  ) {
    const userId = this.getUserId(req);
    return this.attachmentsService.listByTask(userId, taskId);
  }

  @Post('tasks/:taskId/attachments')
  @UseInterceptors(FilesInterceptor('files'))
  upload(
    @Req() req: RequestWithUser,
    @Param('taskId') taskId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = this.getUserId(req);
    return this.attachmentsService.upload(userId, taskId, files);
  }

  @Get('attachments/:attachmentId')
  getById(
    @Req() req: RequestWithUser,
    @Param('attachmentId') attachmentId: string,
  ) {
    const userId = this.getUserId(req);
    return this.attachmentsService.getById(userId, attachmentId);
  }

  @Delete('attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Req() req: RequestWithUser,
    @Param('attachmentId') attachmentId: string,
  ) {
    const userId = this.getUserId(req);
    return this.attachmentsService.remove(userId, attachmentId);
  }
}
