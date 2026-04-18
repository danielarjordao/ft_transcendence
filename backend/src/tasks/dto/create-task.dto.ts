import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';

export enum ApiTaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  subjectId?: string;

  // Status is accepted as a string (slug or ID) and resolved dynamically by the Service.
  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(ApiTaskPriority)
  @IsOptional()
  priority?: ApiTaskPriority;
}
