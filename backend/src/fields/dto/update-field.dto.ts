import { IsString, IsHexColor, IsOptional } from 'class-validator';

export class UpdateFieldDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;
}
