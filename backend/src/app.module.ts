import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TasksModule } from './tasks/tasks.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { SubjectsModule } from './subjects/subjects.module';
import { FieldsModule } from './fields/fields.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Load environment variables from the .env file and make them globally available across the application
      isGlobal: true,
    }),
    StorageModule,
    RealtimeModule,
    PrismaModule,
    SubjectsModule,
    FieldsModule,
    WorkspacesModule,
    TasksModule,
    UsersModule,
    FriendsModule,
    AccountModule,
    AuthModule,
    NotificationsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
