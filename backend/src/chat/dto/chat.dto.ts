import { IsString, IsNotEmpty, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  toUserId!: string;

  @IsString()
  @IsNotEmpty()
  text!: string;
}

export class ChatQueryDto {
  // Verify that @Type is used to transform incoming HTTP query strings into numbers.
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
