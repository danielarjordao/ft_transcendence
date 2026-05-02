import { IsString, MinLength, IsNotEmpty, Matches } from 'class-validator';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const TOTP_CODE_REGEX = /^\d{6}$/;

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  // Verify that a minimum length is enforced here to prevent the Service
  // from allocating resources to hash fundamentally weak or invalid passwords.
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(PASSWORD_STRENGTH_REGEX)
  newPassword!: string;
}

export class Verify2FaDto {
  @IsString()
  @Matches(TOTP_CODE_REGEX)
  code!: string;
}
