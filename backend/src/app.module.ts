import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [WorkspacesModule, TasksModule, UsersModule, FriendsModule, AccountModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
