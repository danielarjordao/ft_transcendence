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
  // NestJS return 201 Created by default for POST
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('sign-in')
  // For sign-in, is common to return 200 OK with the tokens and user info
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
  // 202 Accepted is suitable for forgot password since it's an async process
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  // 204 No Content is appropriate for reset password since is not returning any data, just indicating success
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
    // O decorador @Redirect trata de tudo automaticamente.
    // Não precisamos de devolver nada nem de usar o objeto 'res'.
  }

  @Get('42/callback')
  oauth42Callback(@Query('code') code: string) {
    return this.authService.oauth42Callback(code);
  }
}
