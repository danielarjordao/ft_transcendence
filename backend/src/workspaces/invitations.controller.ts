import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';

@UseGuards(JwtAuthGuard)
@Controller('workspace-invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  private getUserId(request: RequestWithUser): string {
    const userId = request.user?.id;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return userId;
  }

  // GET /workspace-invitations — List My Invitations (API 3.8)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.invitationsService.findAll(userId);
  }

  // PATCH /workspace-invitations/:invitationId — Respond to Invitation (API 3.9)
  @Patch(':invitationId')
  update(
    @Req() req: RequestWithUser,
    @Param('invitationId') invitationId: string,
    @Body() updateDto: UpdateWorkspaceInvitationDto,
  ) {
    const userId = this.getUserId(req);
    return this.invitationsService.update(userId, invitationId, updateDto);
  }
}
