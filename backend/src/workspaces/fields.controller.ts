import {
  Controller,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { UpdateFieldDto } from './dto/field.dto';

// Handles standalone field routes that are not nested under /workspaces/:wsId
// PATCH and DELETE operate on a known fieldId without needing the workspace context
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  // PATCH /fields/:fieldId — Update field name/color (API 4.7)
  @Patch(':fieldId')
  updateField(
    @Param('fieldId') fieldId: string,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.fieldsService.update(fieldId, updateFieldDto);
  }

  // DELETE /fields/:fieldId — Remove field (API 4.8)
  @Delete(':fieldId')
  @HttpCode(204)
  removeField(@Param('fieldId') fieldId: string) {
    return this.fieldsService.remove(fieldId);
  }
}
