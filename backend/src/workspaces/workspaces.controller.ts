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
import { InviteMemberDto } from './dto/workspace-invitation.dto';
import { UpdateMemberRoleDto } from './dto/workspace-member.dto';

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

  // Section 3.6
  @Get(':wsId/members')
  listMembers(@Param('wsId') wsId: string) {
    // TODO: Extract actual userId from JWT to verify access
    return this.workspacesService.listMembers('usr_123', wsId);
  }

  // Section 3.7
  @Post(':wsId/invitations')
  inviteMember(@Param('wsId') wsId: string, @Body() dto: InviteMemberDto) {
    // TODO: Extract actual userId from JWT to verify admin rights
    return this.workspacesService.inviteMember('usr_123', wsId, dto);
  }

  // Section 3.10
  @Patch(':wsId/members/:memberId')
  updateMemberRole(
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    // TODO: Extract actual userId from JWT to verify admin rights
    return this.workspacesService.updateMemberRole(
      'usr_123',
      wsId,
      memberId,
      dto,
    );
  }

  // Section 3.11
  @Delete(':wsId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
  ) {
    // TODO: Extract actual userId from JWT to verify admin rights
    this.workspacesService.removeMember('usr_123', wsId, memberId);
    return;
  }
}
