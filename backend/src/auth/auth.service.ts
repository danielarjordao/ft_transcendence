import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHmac, randomBytes } from 'crypto';
import {
  SessionStatus,
  type Session,
  type User,
} from '../generated/prisma/client';
import { AuthProvider } from '../generated/prisma/enums';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private getAccessTokenSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'default_dev_secret';
  }

  private getRefreshTokenSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
  }

  private getAccessTokenExpiresIn(): string {
    return process.env.JWT_ACCESS_EXPIRES_IN || '15min';
  }

  private getRefreshTokenExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  private getPasswordResetExpiresMinutes(): number {
    const rawValue = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || '30');

    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 30;
  }

  private getPasswordResetBaseUrl(): string {
    return (
      process.env.PASSWORD_RESET_FRONTEND_URL ||
      'http://localhost:5173/reset-password'
    );
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName || '',
      username: user.username,
      bio: user.bio || '',
      avatarUrl: user.avatarUrl,
      accountType: user.accountType,
    };
  }

  private async generateAccessToken(userId: string, email: string) {
    const payload: JwtPayload = { sub: userId, email };

    return this.jwtService.signAsync(payload, {
      secret: this.getAccessTokenSecret(),
      expiresIn: this.getAccessTokenExpiresIn(),
    });
  }

  private async generateRefreshToken(userId: string, email: string) {
    const payload = { sub: userId, email };

    return this.jwtService.signAsync(payload, {
      secret: this.getRefreshTokenSecret(),
      expiresIn: this.getRefreshTokenExpiresIn(),
    });
  }

  // Centralized token generation keeps both tokens aligned with the same payload.
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email),
      this.generateRefreshToken(userId, email),
    ]);

    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.getRefreshTokenSecret(),
        },
      );

      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashToken(token: string): string {
    return createHmac('sha256', process.env.AUTH_TOKEN_PEPPER || 'dev_pepper')
      .update(token)
      .digest('hex');
  }

  private createRandomToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private calculateExpiration(duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  private calculateExpirationFromMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private buildPasswordResetLink(token: string): string {
    const baseUrl = this.getPasswordResetBaseUrl();
    const separator = baseUrl.includes('?') ? '&' : '?';

    return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  private async createSession(
    userId: string,
    refreshToken: string,
    context?: SessionContext,
  ) {
    return this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt: this.calculateExpiration(this.getRefreshTokenExpiresIn()),
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
    });
  }

  private async revokeSession(
    sessionId: string,
    replacedBySessionId?: string,
  ): Promise<Session> {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.REVOKED,
        revokedAt: new Date(),
        replacedBySessionId,
      },
    });
  }

  async signUp(dto: SignUpDto, context?: SessionContext) {
    // Fail-Fast: Verify the database for existing constraints before initiating hashing.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        lastLoginAt: new Date(),
        // TODO: [Feature - OAuth 42] Add logic to determine accountType dynamically based on the registration origin.
        accountType: 'standard',
        authAccounts: {
          create: {
            provider: 'LOCAL',
            providerAccountId: dto.email,
            passwordHash: hashedPassword,
          },
        },
      },
    });

    const tokens = await this.generateTokens(newUser.id, newUser.email);
    await this.createSession(newUser.id, tokens.refreshToken, context);

    return {
      ...tokens,
      user: this.serializeUser(newUser),
    };
  }

  async signIn(dto: SignInDto, context?: SessionContext) {
    // Verify that the query explicitly requires the LOCAL authentication provider.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        authAccounts: {
          where: { provider: 'LOCAL' },
        },
      },
    });

    // Fail-Fast: Reject immediately if the user does not exist or lacks a LOCAL account.
    if (!user || !user.authAccounts || user.authAccounts.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authAccount = user.authAccounts[0];
    const storedHash = authAccount.passwordHash;

    if (!storedHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, storedHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: [Feature - 2FA] Check if the user has 2FA enabled.
    // If yes, abort full token generation and return a partial response indicating an OTP code is required.

    const tokens = await this.generateTokens(user.id, user.email);
    await Promise.all([
      this.createSession(user.id, tokens.refreshToken, context),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    return {
      ...tokens,
      user: this.serializeUser(user),
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const refreshTokenHash = this.hashToken(dto.refreshToken);

    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
    });

    if (
      !session ||
      session.status !== SessionStatus.ACTIVE ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.userId !== payload.sub
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.prisma.$transaction(async (tx) => {
      const newSession = await tx.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: this.hashToken(tokens.refreshToken),
          expiresAt: this.calculateExpiration(this.getRefreshTokenExpiresIn()),
          userAgent: session.userAgent,
          ipAddress: session.ipAddress,
        },
      });

      await tx.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: new Date(),
          replacedBySessionId: newSession.id,
        },
      });
    });

    return tokens;
  }

  async logout(dto: RefreshTokenDto): Promise<void> {
    const refreshTokenHash = this.hashToken(dto.refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash },
    });

    if (
      !session ||
      session.status !== SessionStatus.ACTIVE ||
      session.revokedAt
    ) {
      return;
    }

    await this.revokeSession(session.id);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return;
    }

    const localAuthAccount = await this.prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId: user.id,
          provider: AuthProvider.LOCAL,
        },
      },
    });

    if (!localAuthAccount) {
      return;
    }

    const resetToken = this.createRandomToken();
    const tokenHash = this.hashToken(resetToken);
    const resetLink = this.buildPasswordResetLink(resetToken);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: this.calculateExpirationFromMinutes(
            this.getPasswordResetExpiresMinutes(),
          ),
        },
      });
    });

    await this.mailService.sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = this.hashToken(dto.token);
    const passwordResetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!passwordResetToken || passwordResetToken.usedAt) {
      throw new NotFoundException('Reset token not found');
    }

    if (passwordResetToken.expiresAt <= new Date()) {
      throw new UnauthorizedException('Reset token expired');
    }

    const localAuthAccount = await this.prisma.authAccount.findUnique({
      where: {
        userId_provider: {
          userId: passwordResetToken.userId,
          provider: AuthProvider.LOCAL,
        },
      },
    });

    if (!localAuthAccount) {
      throw new NotFoundException('Local auth account not found');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.authAccount.update({
        where: { id: localAuthAccount.id },
        data: {
          passwordHash: hashedPassword,
        },
      });

      await tx.user.update({
        where: { id: passwordResetToken.userId },
        data: {
          passwordChangedAt: now,
        },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: passwordResetToken.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });

      await tx.session.updateMany({
        where: {
          userId: passwordResetToken.userId,
          status: SessionStatus.ACTIVE,
          revokedAt: null,
        },
        data: {
          status: SessionStatus.REVOKED,
          revokedAt: now,
        },
      });
    });
  }

  oauth42Callback(_code: string) {
    // TODO: [Feature - OAuth 42] Exchange the callback 'code' for an access token via the 42 API HTTP request.
    // TODO: [Feature - OAuth 42] Fetch the user's profile data using the acquired 42 access token.
    // TODO: [Feature - OAuth 42] Upsert the user in our database with accountType 'oauth_42'.
    // TODO: [Feature - OAuth 42] Generate and return our internal JWT tokens for the session.
    throw new NotImplementedException(
      'OAuth42 Callback method not implemented yet.',
    );
  }
}
