import { IsString, IsEnum } from 'class-validator';

export class CreateFieldDto {
  @IsString()
  name: string;

  @IsEnum(['text', 'number', 'select', 'date', 'checkbox'])
  type: string;
}
