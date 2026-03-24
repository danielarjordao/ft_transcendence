import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
} from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

@Controller('workspaces/:workspaceId/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.subjectsService.findAll(workspaceId);
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(workspaceId, dto);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateSubjectDto>, // Removemos o any daqui também
  ) {
    return this.subjectsService.update(workspaceId, id, updateData);
  }

  @Delete(':id')
  remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.subjectsService.remove(workspaceId, id);
  }
}
