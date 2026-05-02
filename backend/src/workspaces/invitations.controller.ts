import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  Param,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UpdateWorkspaceInvitationDto } from './dto/update-invitation.dto';
import { WorkspaceInvitationTokenDto } from './dto/invitation-token.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { RequestWithUser } from 'src/common/guards/interfaces/active-user.interface';

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

  @Get('preview')
  preview(@Query() query: WorkspaceInvitationTokenDto) {
    return this.invitationsService.previewByToken(query.token);
  }

  // GET /workspace-invitations — List My Invitations (API 3.8)
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: RequestWithUser) {
    const userId = this.getUserId(req);
    return this.invitationsService.findAll(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claim')
  @HttpCode(200)
  claim(
    @Req() req: RequestWithUser,
    @Body() body: WorkspaceInvitationTokenDto,
  ) {
    const userId = this.getUserId(req);
    return this.invitationsService.claimByToken(userId, body.token);
  }

  // PATCH /workspace-invitations/:invitationId — Respond to Invitation (API 3.9)
  @UseGuards(JwtAuthGuard)
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
