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
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { SubjectsService } from './subjects.service';
import { FieldsService } from './fields.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateSubjectDto } from './dto/subject.dto';
import { CreateFieldDto } from './dto/field.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly subjectsService: SubjectsService,
    private readonly fieldsService: FieldsService,
  ) {}

  // POST /workspaces — Create workspace (API 3.2)
  @Post()
  create(@Body() createWorkspaceDto: CreateWorkspaceDto) {
    return this.workspacesService.create(createWorkspaceDto);
  }

  // GET /workspaces?search=&limit=&offset= — List workspaces (API 3.1)
  @Get()
  findAll(@Query() query: ListWorkspacesQueryDto) {
    return this.workspacesService.findAll(query);
  }

  // GET /workspaces/:wsId — Get workspace details (API 3.3)
  @Get(':wsId')
  findOne(@Param('wsId') wsId: string) {
    return this.workspacesService.findOne(wsId);
  }

  // PATCH /workspaces/:wsId — Update workspace name/description (API 3.4)
  @Patch(':wsId')
  update(
    @Param('wsId') wsId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(wsId, updateWorkspaceDto);
  }

  // DELETE /workspaces/:wsId — Delete workspace (API 3.5)
  @Delete(':wsId')
  @HttpCode(204)
  remove(@Param('wsId') wsId: string) {
    return this.workspacesService.remove(wsId);
  }

  // TODO (API 3.6): GET /workspaces/:wsId/members
  // Requires UsersService to enrich member data (username, fullName, avatarUrl, status)

  // TODO (API 3.7): POST /workspaces/:wsId/invitations
  // Requires UsersService.findByEmail() to resolve the invited user before creating the invitation

  // TODO (API 3.10): PATCH /workspaces/:wsId/members/:userId — Update member role (owner/member) or remove member
  // Requires UsersService to verify the userId and WorkspacesService to check workspace membership and permissions

  // TODO (API 3.11): DELETE /workspaces/:wsId/invitations/:invitationId — Revoke invitation
  // Requires WorkspacesService to check workspace membership and permissions before deleting the invitation

  // GET /workspaces/:wsId/subjects — List subjects (API 4.1)
  @Get(':wsId/subjects')
  listSubjects(@Param('wsId') wsId: string) {
    return this.subjectsService.list(wsId);
  }

  // POST /workspaces/:wsId/subjects — Create subject (API 4.2)
  @Post(':wsId/subjects')
  createSubject(
    @Param('wsId') wsId: string,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(wsId, createSubjectDto);
  }

  // GET /workspaces/:wsId/fields — List fields (API 4.5)
  @Get(':wsId/fields')
  listFields(@Param('wsId') wsId: string) {
    return this.fieldsService.list(wsId);
  }

  // POST /workspaces/:wsId/fields — Create field (API 4.6)
  @Post(':wsId/fields')
  createField(
    @Param('wsId') wsId: string,
    @Body() createFieldDto: CreateFieldDto,
  ) {
    return this.fieldsService.create(wsId, createFieldDto);
  }
}
