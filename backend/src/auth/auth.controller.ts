import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Query,
  Redirect,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  // NestJS returns 201 Created by default for POST requests
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('sign-in')
  // For sign-in, it is standard to return 200 OK instead of the default 201 Created
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  // 204 No Content is appropriate for logout since we don't return any data
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    this.authService.logout(dto);
  }

  @Post('forgot-password')
  // 202 Accepted is suitable for forgot password since it's an asynchronous process (sending email)
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  // 204 No Content indicates success without returning data
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    this.authService.resetPassword(dto);
  }

  @Get('42')
  @Redirect(
    'https://api.intra.42.fr/oauth/authorize?client_id=mock&redirect_uri=mock&response_type=code',
    302,
  )
  oauth42Redirect() {
    // The @Redirect decorator handles the 302 response automatically.
    // No need to return anything or manipulate the response object directly.
  }

  @Get('42/callback')
  oauth42Callback(@Query('code') code: string) {
    return this.authService.oauth42Callback(code);
  }
}
