import { Global, Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { ChatService } from '../chat/chat.service';

// The RealtimeModule is designed to encapsulate all real-time communication logic, including WebSocket gateways and related services.
// By marking it as @Global, we ensure that the AppGateway can be injected across the entire application without needing to import RealtimeModule in every module that requires real-time capabilities.
@Global()
@Module({
  providers: [AppGateway, ChatService],
  exports: [AppGateway],
})
export class RealtimeModule {}
