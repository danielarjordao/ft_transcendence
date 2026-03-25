import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';

// No global prefix so it is expected that all routes are defined with their full path as per the API contract (e.g., /workspaces/:workspaceId/fields)
@Controller()
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get('workspaces/:workspaceId/fields')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.fieldsService.findAll(workspaceId);
  }

  @Post('workspaces/:workspaceId/fields')
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fieldsService.create(workspaceId, dto);
  }

  @Patch('fields/:fieldId')
  update(
    @Param('fieldId') fieldId: string,
    @Body() updateData: Partial<CreateFieldDto>,
  ) {
    return this.fieldsService.update(fieldId, updateData);
  }

  @Delete('fields/:fieldId')
  // Required by API Contract
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('fieldId') fieldId: string) {
    this.fieldsService.remove(fieldId);
  }
}
