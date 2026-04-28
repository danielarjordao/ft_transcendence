import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Query,
  Redirect,
} from '@nestjs/common';
import type { Request } from 'express';
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

  private getSessionContext(req: Request) {
    const userAgent = req.headers['user-agent'];

    return {
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      ipAddress: req.ip,
    };
  }

  @Post('sign-up')
  signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    return this.authService.signUp(dto, this.getSessionContext(req));
  }

  @Post('sign-in')
  // Verify that sign-in returns 200 OK, as it authorizes an existing resource rather than creating a new entity.
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: SignInDto, @Req() req: Request) {
    return this.authService.signIn(dto, this.getSessionContext(req));
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
    return this.authService.logout(dto);
  }

  @Post('forgot-password')
  // Verify that 202 Accepted is used to indicate an asynchronous background process (email dispatch).
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
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
