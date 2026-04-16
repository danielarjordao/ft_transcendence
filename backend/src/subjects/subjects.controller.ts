import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/decorators/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  }

  @Get('workspaces/:workspaceId/subjects')
  findAll(
    @Req() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = this.getUserId(req);
    return this.subjectsService.findAll(userId, workspaceId);
  }

  @Post('workspaces/:workspaceId/subjects')
  create(
    @Req() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    const userId = this.getUserId(req);
    return this.subjectsService.create(userId, workspaceId, dto);
  }

  @Patch('subjects/:subjectId')
  update(
    @Req() req: RequestWithUser,
    @Param('subjectId') subjectId: string,
    @Body() updateData: UpdateSubjectDto,
  ) {
    const userId = this.getUserId(req);
    return this.subjectsService.update(userId, subjectId, updateData);
  }

  @Delete('subjects/:subjectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('subjectId') subjectId: string) {
    const userId = this.getUserId(req);
    return this.subjectsService.remove(userId, subjectId);
  }
}
