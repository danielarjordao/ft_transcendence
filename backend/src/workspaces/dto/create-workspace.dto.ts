import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Sub-DTO to type the Subjects (Tags) of the Workspace
class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}

// Sub-DTO to type the Fields of the Workspace
class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  color: string;
}

// Main DTO for creating a Workspace, including optional Subjects and Fields
export class CreateWorkspaceDto {
  @IsString({ message: 'The workspace name must be a string.' })
  @IsNotEmpty({ message: 'The workspace name is required.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateSubjectDto)
  subjects?: CreateSubjectDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateFieldDto)
  fields?: CreateFieldDto[];
}
