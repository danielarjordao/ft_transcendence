import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectDto } from '../../subjects/dto/create-subject.dto';
import { CreateFieldDto } from '../../fields/dto/create-field.dto';

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
