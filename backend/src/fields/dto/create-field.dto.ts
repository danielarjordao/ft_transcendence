import { IsString, IsHexColor } from 'class-validator';

export class CreateFieldDto {
  @IsString()
  name!: string;

  @IsHexColor()
  color!: string;
}
