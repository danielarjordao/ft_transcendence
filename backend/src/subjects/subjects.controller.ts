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
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Controller() // Removed global prefix to match precise API contract routes
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get('workspaces/:workspaceId/subjects')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.subjectsService.findAll(workspaceId);
  }

  @Post('workspaces/:workspaceId/subjects')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(workspaceId, dto);
  }

  @Patch('subjects/:subjectId')
  update(
    @Param('subjectId') subjectId: string,
    @Body() updateData: Partial<CreateSubjectDto>,
  ) {
    return this.subjectsService.update(subjectId, updateData);
  }

  @Delete('subjects/:subjectId')
  @HttpCode(HttpStatus.NO_CONTENT) // Required by API Contract
  remove(@Param('subjectId') subjectId: string) {
    this.subjectsService.remove(subjectId);
  }
}
