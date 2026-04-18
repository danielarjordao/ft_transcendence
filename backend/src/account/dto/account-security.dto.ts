import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  // Verify that a minimum length is enforced here to prevent the Service
  // from allocating resources to hash fundamentally weak or invalid passwords.
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class Verify2FaDto {
  @IsString()
  code!: string;
}
