import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [WorkspacesController, InvitationsController],
  providers: [WorkspacesService, InvitationsService],
})
export class WorkspacesModule {}
