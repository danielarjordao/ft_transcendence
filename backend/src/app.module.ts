import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [WorkspacesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
