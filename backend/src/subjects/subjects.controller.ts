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
} from '@nestjs/common';
import { Request } from 'express';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto } from './dto/create-subject.dto';

// Imterface to extend the standard Express Request object with our custom user property.
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Controller() // Removed global prefix to match precise API contract routes
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get('workspaces/:workspaceId/subjects')
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.subjectsService.findAll(workspaceId);
  }

  @Post('workspaces/:workspaceId/subjects')
  create(
    @Req() req: AuthenticatedRequest,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateSubjectDto,
  ) {
    // Add a 'return' statement to ensure that any exceptions thrown by the service are properly propagated and handled by NestJS.
    return this.subjectsService.create(req.user.id, workspaceId, dto);
  }

  @Patch('subjects/:subjectId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('subjectId') subjectId: string,
    @Body() updateData: Partial<CreateSubjectDto>,
  ) {
    return this.subjectsService.update(req.user.id, subjectId, updateData);
  }

  @Delete('subjects/:subjectId')
  @HttpCode(HttpStatus.NO_CONTENT) // Required by API Contract
  remove(
    @Req() req: AuthenticatedRequest,
    @Param('subjectId') subjectId: string,
  ) {
    // Adding 'return' ensures that any exceptions thrown by the service are properly propagated and handled by NestJS, allowing for correct HTTP responses based on the outcome of the operation.
    return this.subjectsService.remove(req.user.id, subjectId);
  }
}
