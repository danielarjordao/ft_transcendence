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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';

// Simple typed interface to avoid the use of 'any'
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

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
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFieldDto,
  ) {
    return this.fieldsService.create(req.user.id, workspaceId, dto);
  }

  @Patch('fields/:fieldId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('fieldId') fieldId: string,
    @Body() updateData: Partial<CreateFieldDto>,
  ) {
    return this.fieldsService.update(req.user.id, fieldId, updateData);
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT) // Required by API Contract
  remove(@Req() req: AuthenticatedRequest, @Param('fieldId') fieldId: string) {
    // Returning the promise ensures NestJS properly catches and handles
    // Prisma exceptions (like P2003) thrown inside the service.
    return this.fieldsService.remove(req.user.id, fieldId);
  }
}
