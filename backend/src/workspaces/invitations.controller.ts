import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('workspace-invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // GET /workspace-invitations — List My Invitations (API 3.8)
  @Get()
  findAll(@ActiveUser('id') userId: string) {
    return this.invitationsService.findAll(userId);
  }

  // PATCH /workspace-invitations/:invitationId — Respond to Invitation (API 3.9)
  @Patch(':invitationId')
  update(
    @ActiveUser('id') userId: string,
    @Param('invitationId') invitationId: string,
    @Body() updateDto: UpdateWorkspaceInvitationDto,
  ) {
    return this.invitationsService.update(userId, invitationId, updateDto);
  }
}
