import { Controller, Get, Post, Body } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Controller('workspaces')
export class WorkspacesController {
  // Dependency Injection: constructor injects the WorkspacesService to handle business logic related to workspaces
  constructor(private readonly workspacesService: WorkspacesService) {}

  // POST /workspaces - Endpoint to create a new workspace, expects a CreateWorkspaceDto in the request body
  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  // GET /workspaces - Endpoint to retrieve all workspaces, returns a paginated list of workspaces
  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }
}
