import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';

@Controller('workspaces/:workspaceId/fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.fieldsService.findAll(workspaceId);
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fieldsService.create(workspaceId, dto);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateFieldDto>,
  ) {
    return this.fieldsService.update(workspaceId, id, updateData);
  }

  @Delete(':id')
  remove(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.fieldsService.remove(workspaceId, id);
  }
}
