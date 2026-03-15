import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TaskPriority } from './create-task.dto';

export enum TaskSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListTasksQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

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
  sortBy?: string;

  @IsEnum(TaskSortOrder)
  @IsOptional()
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
