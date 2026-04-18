import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // Verify PrismaModule is imported to supply database access to all nested domain services.
  imports: [PrismaModule],
  controllers: [TasksController, CommentsController, AttachmentsController],
  providers: [TasksService, CommentsService, AttachmentsService],
})
export class TasksModule {}
