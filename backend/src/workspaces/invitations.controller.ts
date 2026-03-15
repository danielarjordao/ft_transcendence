import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';

@Controller('workspace-invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // GET /workspace-invitations — List My Invitations (API 3.8)
  @Get()
  findAll() {
    return this.invitationsService.findAll();
  }

  // PATCH /workspace-invitations/:invitationId — Respond to Invitation (API 3.9)
  @Patch(':invitationId')
  update(
    @Param('invitationId') invitationId: string,
    @Body() updateDto: UpdateWorkspaceInvitationDto,
  ) {
    return this.invitationsService.update(invitationId, updateDto);
  }
}
