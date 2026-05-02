import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CookieOptions, Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  TwoFactorSignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { getCookieValue } from './utils/cookies';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const REFRESH_TOKEN_COOKIE = 'refreshToken';
const OAUTH42_STATE_COOKIE = 'oauth42_state';

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

  private getCookieOptions(maxAge?: number): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(maxAge !== undefined ? { maxAge } : {}),
    };
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, this.getCookieOptions(15 * 60 * 1000));
    res.cookie(
      REFRESH_TOKEN_COOKIE,
      refreshToken,
      this.getCookieOptions(7 * 24 * 60 * 60 * 1000),
    );
  }

  private clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, this.getCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE, this.getCookieOptions());
  }

  private resolveRefreshToken(req: Request, dto?: RefreshTokenDto): string | undefined {
    return dto?.refreshToken || getCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE);
  }

  @Post('sign-up')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  signUp(@Body() dto: SignUpDto, @Req() req: Request) {
    return this.authService.signUp(dto, this.getSessionContext(req));
  }

  @Post('sign-in')
  // Verify that sign-in returns 200 OK, as it authorizes an existing resource rather than creating a new entity.
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  signIn(@Body() dto: SignInDto, @Req() req: Request) {
    return this.authService.signIn(dto, this.getSessionContext(req));
  }

  @Post('2fa/sign-in')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  signInWithTwoFactor(@Body() dto: TwoFactorSignInDto, @Req() req: Request) {
    return this.authService.signInWithTwoFactor(
      dto,
      this.getSessionContext(req),
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.resolveRefreshToken(req, dto);

    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.authService.refresh({ refreshToken });

    if (getCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE)) {
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    }

    return tokens;
  }

  @Post('logout')
  // Verify that 204 No Content is used here to indicate the successful teardown of the session.
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.resolveRefreshToken(req, dto);

    this.clearAuthCookies(res);

    if (!refreshToken) {
      return;
    }

    return this.authService.logout({ refreshToken });
  }

  @Post('forgot-password')
  // Verify that 202 Accepted is used to indicate an asynchronous background process (email dispatch).
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Get('42')
  oauth42Redirect(@Res() res: Response) {
    const state = randomUUID();

    res.cookie(
      OAUTH42_STATE_COOKIE,
      state,
      this.getCookieOptions(10 * 60 * 1000),
    );

    return res.redirect(this.authService.getOAuth42AuthorizationUrl(state));
  }

  @Get('42/callback')
  async oauth42Callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const stateFromCookie = getCookieValue(req.headers.cookie, OAUTH42_STATE_COOKIE);

    res.clearCookie(OAUTH42_STATE_COOKIE, this.getCookieOptions());

    if (!code || !state || !stateFromCookie || stateFromCookie !== state) {
      return res.redirect(`${this.authService.getFrontendAuthCallbackUrl()}?error=oauth_state`);
    }

    const result = await this.authService.oauth42Callback(
      code,
      this.getSessionContext(req),
    );

    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.redirect(this.authService.getFrontendAuthCallbackUrl());
  }
}
