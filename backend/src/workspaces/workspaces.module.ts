import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

// The WorkspacesModule is a NestJS module that encapsulates all components related to the "workspaces" feature, including the controller and service.
// It organizes the code and allows for easy scalability as we add more features related to workspaces in the future.
@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
