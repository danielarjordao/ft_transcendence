import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [WorkspacesModule, TasksModule, UsersModule, FriendsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
