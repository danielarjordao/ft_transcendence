import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiTaskPriority, TaskSortOrder } from './task-enums.dto'; // <-- Clean API import

export class ListTasksQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  // Use the API boundary enum, preventing Prisma leakage.
  @IsEnum(ApiTaskPriority)
  @IsOptional()
  priority?: ApiTaskPriority;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  assignee?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsDateString()
  @IsOptional()
  dueFrom?: string;

  @IsDateString()
  @IsOptional()
  dueTo?: string;

  @IsString()
  @IsOptional()
  @IsIn(['dueDate', 'title', 'priority', 'createdAt'])
  sortBy?: string;

  @IsEnum(TaskSortOrder)
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: TaskSortOrder;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  offset?: number;
}
