import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  username?: string;

  // Boundary constraints protect the database from excessively large payloads.
  @IsString()
  @IsOptional()
  @MaxLength(160)
  bio?: string;
}
