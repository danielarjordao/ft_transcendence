import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { FieldsController } from './fields.controller';
import { FieldsService } from './fields.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [
    WorkspacesController,
    SubjectsController,
    FieldsController,
    InvitationsController,
  ],
  providers: [
    WorkspacesService,
    SubjectsService,
    FieldsService,
    InvitationsService,
  ],
})
export class WorkspacesModule {}
