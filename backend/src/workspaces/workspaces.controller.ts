import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';
import { WorkspacesService } from './workspaces.service';
import { InvitationsService } from './invitations.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ListWorkspacesQueryDto } from './dto/list-workspaces.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/workspace-member.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

// Apply JWT authentication guard to all routes in this controller
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly invitationsService: InvitationsService,
  ) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return userId;
  }

  @Post()
  create(
    @Req() req: RequestWithUser,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    const userId = this.getUserId(req);
    return this.workspacesService.create(userId, createWorkspaceDto);
  }

  @Get()
  findAll(@Req() req: RequestWithUser, @Query() query: ListWorkspacesQueryDto) {
    const userId = this.getUserId(req);
    return this.workspacesService.findAll(userId, query);
  }

  @Get(':wsId')
  findOne(@Req() req: RequestWithUser, @Param('wsId') wsId: string) {
    const userId = this.getUserId(req);
    return this.workspacesService.findOne(userId, wsId);
  }

  @Patch(':wsId')
  update(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const userId = this.getUserId(req);
    return this.workspacesService.update(userId, wsId, updateWorkspaceDto);
  }

  @Delete(':wsId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: RequestWithUser, @Param('wsId') wsId: string) {
    const userId = this.getUserId(req);
    return this.workspacesService.remove(userId, wsId);
  }

  // Section 3.6
  @Get(':wsId/members')
  listMembers(@Req() req: RequestWithUser, @Param('wsId') wsId: string) {
    const userId = this.getUserId(req);
    return this.workspacesService.listMembers(userId, wsId);
  }

  // Section 3.7
  @Post(':wsId/invitations')
  inviteMember(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const userId = this.getUserId(req);
    return this.invitationsService.create(userId, wsId, {
      email: dto.email,
      role: dto.role,
    });
  }

  // Section 3.10
  @Patch(':wsId/members/:memberId')
  updateMemberRole(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    const userId = this.getUserId(req);
    return this.workspacesService.updateMemberRole(userId, wsId, memberId, dto);
  }

  // Section 3.11
  @Delete(':wsId/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Req() req: RequestWithUser,
    @Param('wsId') wsId: string,
    @Param('memberId') memberId: string,
  ) {
    const userId = this.getUserId(req);
    return this.workspacesService.removeMember(userId, wsId, memberId);
  }
}
