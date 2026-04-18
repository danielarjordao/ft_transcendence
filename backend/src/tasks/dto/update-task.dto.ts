import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiTaskPriority } from './task-enums.dto'; // <-- Clean API import

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Use the API boundary enum, preventing Prisma leakage.
  @IsEnum(ApiTaskPriority)
  @IsOptional()
  priority?: ApiTaskPriority;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
