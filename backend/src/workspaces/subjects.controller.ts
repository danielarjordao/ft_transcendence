import {
  Controller,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { UpdateSubjectDto } from './dto/subject.dto';

// Handles standalone subject routes that are not nested under /workspaces/:wsId
// PATCH and DELETE operate on a known subjectId without needing the workspace context
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  // PATCH /subjects/:subjectId — Update subject name/color (API 4.3)
  @Patch(':subjectId')
  updateSubject(
    @Param('subjectId') subjectId: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(subjectId, updateSubjectDto);
  }

  // DELETE /subjects/:subjectId — Remove subject (API 4.4)
  @Delete(':subjectId')
  @HttpCode(204)
  removeSubject(@Param('subjectId') subjectId: string) {
    return this.subjectsService.remove(subjectId);
  }
}
