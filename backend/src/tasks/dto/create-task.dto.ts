import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

// Enum to define allowed priority levels
export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  // Identifies which workspace this task belongs to
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  // Identifies the column (e.g., 'To Do', 'In Progress')
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
