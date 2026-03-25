import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    // TODO: Extract actual userId from JWT
    return this.workspacesService.create('usr_123', createWorkspaceDto);
  }

  @Get()
  findAll(@Query() query: ListWorkspacesQueryDto) {
    // TODO: Extract actual userId from JWT
    return this.workspacesService.findAll('usr_123', query);
  }

  @Get(':wsId')
  findOne(@Param('wsId') wsId: string) {
    // TODO: Extract actual userId from JWT
    return this.workspacesService.findOne('usr_123', wsId);
  }

  @Patch(':wsId')
  update(
    @Param('wsId') wsId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    // TODO: Extract actual userId from JWT
    return this.workspacesService.update('usr_123', wsId, updateWorkspaceDto);
  }

  @Delete(':wsId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('wsId') wsId: string) {
    // TODO: Extract actual userId from JWT
    return this.workspacesService.remove('usr_123', wsId);
  }
}
