import {
  IsOptional,
  IsString,
  IsBooleanString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsQueryDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsBooleanString()
  @IsOptional()
  read?: string;

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
