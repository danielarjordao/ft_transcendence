import { IsBooleanString, IsOptional } from 'class-validator';

export class ListAttachmentsQueryDto {
  @IsBooleanString()
  @IsOptional()
  preview?: string;
}
