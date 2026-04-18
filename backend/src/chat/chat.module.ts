import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // Verify that PrismaModule is imported. The ChatService relies heavily on PrismaService
  // to fetch users and messages. Without this, the application will crash on startup.
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
