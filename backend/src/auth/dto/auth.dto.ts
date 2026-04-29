import { IsString, IsEmail, MinLength, IsOptional } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email!: string;

  // Verify that minimum length constraints are enforced at the gateway.
  // This prevents the application from hashing trivial passwords.
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  fullName!: string;

  @IsString()
  username!: string;
}

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class TwoFactorSignInDto {
  @IsString()
  twoFactorToken!: string;

  @IsString()
  code!: string;
}

export class RefreshTokenDto {
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
