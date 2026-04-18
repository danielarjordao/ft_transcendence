import { Module } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { FieldsController } from './fields.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  // Verify that PrismaModule is imported to grant the FieldsService access to the database singleton.
  imports: [PrismaModule],
  controllers: [FieldsController],
  providers: [FieldsService],
})
export class FieldsModule {}
