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
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { InvitationsService } from './invitations.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';
import { InviteMemberDto } from './dto/workspace-invitation.dto';
import { UpdateMemberRoleDto } from './dto/workspace-member.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';

// Apply JWT authentication guard to all routes in this controller
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  @Post()
  create(
    @ActiveUser('id') userId: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(userId, createWorkspaceDto);
  }

  @Get()
  findAll(
    @ActiveUser('id') userId: string,
    @Query() query: ListWorkspacesQueryDto,
  ) {
    return this.workspacesService.findAll(userId, query);
  }

  @Get(':wsId')
  findOne(@ActiveUser('id') userId: string, @Param('wsId') wsId: string) {
    return this.workspacesService.findOne(userId, wsId);
  }

  @Patch(':wsId')
  update(
    @ActiveUser('id') userId: string,
    @Param('wsId') wsId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(userId, wsId, updateWorkspaceDto);
  }

  @Delete(':wsId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@ActiveUser('id') userId: string, @Param('wsId') wsId: string) {
    return this.workspacesService.remove(userId, wsId);
  }

  // Section 3.6
  @Get(':wsId/members')
  listMembers(@ActiveUser('id') userId: string, @Param('wsId') wsId: string) {
    return this.workspacesService.listMembers(userId, wsId);
  }

  // Section 3.7
  @Post(':wsId/invitations')
  inviteMember(
    @ActiveUser('id') userId: string,
    @Param('wsId') wsId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.invitationsService.create(userId, wsId, {
      email: dto.email,
      role: dto.role,
    });
  }

  // Section 3.10
  @Patch(':wsId/members/:memberId')
  updateMemberRole(
    @ActiveUser('id') userId: string,
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(userId, wsId, memberId, dto);
  }

  // Section 3.11
  @Delete(':wsId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @ActiveUser('id') userId: string,
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.workspacesService.removeMember(userId, wsId, memberId);
  }
}
