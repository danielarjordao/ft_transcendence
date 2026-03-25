import { IsString, IsEmail, MinLength } from 'class-validator';

export class SignUpDto {
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(8)
  password: string;
  @IsString()
  fullName: string;
  @IsString()
  username: string;
}

export class SignInDto {
  @IsEmail()
  email: string;
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;
  @IsString()
  @MinLength(8)
  newPassword: string;
}
