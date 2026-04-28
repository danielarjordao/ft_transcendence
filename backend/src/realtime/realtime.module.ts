import { Global, Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { ChatGateway } from './chat.gateway';
import { WorkspacesGateway } from './workspaces.gateway';
import { NotificationsGateway } from './notifications.gateway';
import { ChatService } from '../chat/chat.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

// The RealtimeModule is designed to encapsulate all real-time communication logic.
// By marking it as @Global, ensures that its providers (like AppGateway)
// can be injected across the entire application.
@Global()
@Module({
  imports: [PrismaModule, JwtModule.register({})],
  providers: [
    AppGateway,
    ChatGateway,
    WorkspacesGateway,
    NotificationsGateway,
    ChatService,
  ],
  // Exporting AppGateway allows other modules to inject it and emit events without needing to import the entire RealtimeModule.
  exports: [AppGateway],
})
export class RealtimeModule {}
