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
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return userId;
  }

  @Get('workspaces/:workspaceId/fields')
  findAll(
    @Req() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    const userId = this.getUserId(req);
    return this.fieldsService.findAll(userId, workspaceId);
  }

  @Post('workspaces/:workspaceId/fields')
  create(
    @Req() req: RequestWithUser,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFieldDto,
  ) {
    const userId = this.getUserId(req);
    return this.fieldsService.create(userId, workspaceId, dto);
  }

  @Patch('fields/:fieldId')
  update(
    @Req() req: RequestWithUser,
    @Param('fieldId') fieldId: string,
    @Body() updateData: UpdateFieldDto,
  ) {
    const userId = this.getUserId(req);
    return this.fieldsService.update(userId, fieldId, updateData);
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('fieldId') fieldId: string) {
    const userId = this.getUserId(req);
    return this.fieldsService.remove(userId, fieldId);
  }
}
