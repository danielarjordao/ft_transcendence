import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AppGateway } from '../realtime/app.gateway';

@Module({
  // Verify that PrismaModule is imported. The ChatService relies heavily on PrismaService
  // to fetch users and messages. Without this, the application will crash on startup.
  // Import JwtModule to allow token verification inside the Gateway
  // TODO: Refactor to use JwtModule.register with proper configuration
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [ChatController],
  providers: [ChatService, AppGateway],
})
export class ChatModule {}
