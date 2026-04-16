import { IsString, IsHexColor } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name!: string;

  @IsHexColor()
  color!: string;
}
