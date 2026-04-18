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
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('sign-in')
  // Verify that sign-in returns 200 OK, as it authorizes an existing resource rather than creating a new entity.
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
  // Verify that 204 No Content is used here to indicate the successful teardown of the session.
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() dto: RefreshTokenDto) {
    this.authService.logout(dto);
  }

  @Post('forgot-password')
  // Verify that 202 Accepted is used to indicate an asynchronous background process (email dispatch).
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    this.authService.resetPassword(dto);
  }

  @Get('42')
  // Check that this route correctly proxies the user to the 42 OAuth consent screen.
  @Redirect(
    'https://api.intra.42.fr/oauth/authorize?client_id=mock&redirect_uri=mock&response_type=code',
    302,
  )
  oauth42Redirect() {}

  @Get('42/callback')
  oauth42Callback(@Query('code') code: string) {
    return this.authService.oauth42Callback(code);
  }
}
