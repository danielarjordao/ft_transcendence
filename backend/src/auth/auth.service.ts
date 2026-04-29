import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
  TwoFactorSignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { decryptSecret } from '../common/utils/secret-crypto';
import { verifyTwoFactorCode } from '../common/utils/two-factor';

interface SessionContext {
  userAgent?: string;
  ipAddress?: string;
}

interface OAuth42TokenResponse {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  scope?: string;
  created_at?: number;
  expires_in?: number;
}

interface OAuth42Profile {
  id?: number;
  email?: string;
  login?: string;
  displayname?: string;
  usual_full_name?: string;
  first_name?: string;
  last_name?: string;
  image?: {
    link?: string;
  };
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

  private getTwoFactorTokenSecret(): string {
    return process.env.JWT_2FA_SECRET || 'default_2fa_secret';
  }

  private getTwoFactorTokenExpiresIn(): string {
    return process.env.JWT_2FA_EXPIRES_IN || '5m';
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

  private getOAuth42ClientId(): string {
    const clientId = process.env.FORTY_TWO_CLIENT_ID;

    if (!clientId) {
      throw new InternalServerErrorException('42 OAuth client id is not configured');
    }

    return clientId;
  }

  private getOAuth42ClientSecret(): string {
    const clientSecret = process.env.FORTY_TWO_CLIENT_SECRET;

    if (!clientSecret) {
      throw new InternalServerErrorException(
        '42 OAuth client secret is not configured',
      );
    }

    return clientSecret;
  }

  private getOAuth42CallbackUrl(): string {
    return (
      process.env.FORTY_TWO_CALLBACK_URL ||
      'http://localhost:3000/api/auth/42/callback'
    );
  }

  getFrontendAuthCallbackUrl(): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl.replace(/\/$/, '')}/auth/callback`;
  }

  getOAuth42AuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.getOAuth42ClientId(),
      redirect_uri: this.getOAuth42CallbackUrl(),
      response_type: 'code',
      scope: 'public',
      state,
    });

    return `https://api.intra.42.fr/oauth/authorize?${params.toString()}`;
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

  private async generateTwoFactorToken(userId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        purpose: '2fa',
      },
      {
        secret: this.getTwoFactorTokenSecret(),
        expiresIn: this.getTwoFactorTokenExpiresIn(),
      },
    );
  }

  private async verifyTwoFactorToken(twoFactorToken: string): Promise<string> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        twoFactorToken,
        {
          secret: this.getTwoFactorTokenSecret(),
        },
      );

      if (
        !payload.sub ||
        typeof payload.sub !== 'string' ||
        payload.purpose !== '2fa'
      ) {
        throw new UnauthorizedException('Invalid two-factor token');
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException('Invalid two-factor token');
    }
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

  private normalizeOAuth42ProfileName(profile: OAuth42Profile): string {
    return (
      profile.usual_full_name ||
      profile.displayname ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      profile.login ||
      '42 User'
    );
  }

  private normalizeOAuth42AvatarUrl(profile: OAuth42Profile): string | null {
    return profile.image?.link || null;
  }

  private async createUniqueUsername(baseUsername: string): Promise<string> {
    const sanitizedBase = baseUsername
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24);

    const fallbackBase = sanitizedBase || `user_${this.createRandomToken().slice(0, 8)}`;

    let candidate = fallbackBase;
    let suffix = 1;

    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${fallbackBase}_${suffix}`.slice(0, 30);
      suffix += 1;
    }

    return candidate;
  }

  private async exchangeOAuth42CodeForToken(
    code: string,
  ): Promise<OAuth42TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.getOAuth42ClientId(),
      client_secret: this.getOAuth42ClientSecret(),
      code,
      redirect_uri: this.getOAuth42CallbackUrl(),
    });

    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Invalid OAuth code');
    }

    const tokenResponse = (await response.json()) as OAuth42TokenResponse;

    if (!tokenResponse.access_token) {
      throw new UnauthorizedException('Invalid OAuth code');
    }

    return tokenResponse;
  }

  private async fetchOAuth42Profile(
    accessToken: string,
  ): Promise<OAuth42Profile> {
    const response = await fetch('https://api.intra.42.fr/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Unable to fetch 42 profile');
    }

    return (await response.json()) as OAuth42Profile;
  }

  private async resolveOAuth42User(profile: OAuth42Profile) {
    const providerAccountId = String(profile.id || '');
    const providerEmail = profile.email?.trim().toLowerCase();
    const providerLogin = profile.login?.trim();

    if (!providerAccountId || !providerLogin || !providerEmail) {
      throw new BadRequestException('Invalid 42 profile payload');
    }

    const fullName = this.normalizeOAuth42ProfileName(profile);
    const avatarUrl = this.normalizeOAuth42AvatarUrl(profile);

    const existingAuthAccount = await this.prisma.authAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.FORTY_TWO,
          providerAccountId,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAuthAccount?.user) {
      const updatedUser = await this.prisma.user.update({
        where: { id: existingAuthAccount.user.id },
        data: {
          fullName,
          avatarUrl,
          accountType: 'oauth_42',
          lastLoginAt: new Date(),
        },
      });

      await this.prisma.authAccount.update({
        where: { id: existingAuthAccount.id },
        data: {
          providerEmail,
          scope: 'public',
        },
      });

      return updatedUser;
    }

    let user = await this.prisma.user.findUnique({
      where: { email: providerEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: providerEmail,
          username: await this.createUniqueUsername(providerLogin),
          fullName,
          avatarUrl,
          accountType: 'oauth_42',
          lastLoginAt: new Date(),
        },
      });
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: user.fullName || fullName,
          avatarUrl: user.avatarUrl || avatarUrl,
          accountType: 'oauth_42',
          lastLoginAt: new Date(),
        },
      });
    }

    await this.prisma.authAccount.create({
      data: {
        userId: user.id,
        provider: AuthProvider.FORTY_TWO,
        providerAccountId,
        providerEmail,
        scope: 'public',
      },
    });

    return user;
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

    if (user.twoFactorEnabled) {
      if (!user.twoFactorSecretEnc) {
        throw new InternalServerErrorException(
          'Two-factor authentication is not configured correctly',
        );
      }

      return {
        requiresTwoFactor: true,
        twoFactorToken: await this.generateTwoFactorToken(user.id),
      };
    }

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

  async signInWithTwoFactor(
    dto: TwoFactorSignInDto,
    context?: SessionContext,
  ) {
    const userId = await this.verifyTwoFactorToken(dto.twoFactorToken);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecretEnc) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const secret = decryptSecret(user.twoFactorSecretEnc);
    const isCodeValid = await verifyTwoFactorCode(secret, dto.code);

    if (!isCodeValid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

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

  async oauth42Callback(code: string, context?: SessionContext) {
    const oauthToken = await this.exchangeOAuth42CodeForToken(code);
    const profile = await this.fetchOAuth42Profile(oauthToken.access_token as string);
    const user = await this.resolveOAuth42User(profile);
    const tokens = await this.generateTokens(user.id, user.email);

    await this.createSession(user.id, tokens.refreshToken, context);

    return {
      ...tokens,
      user: this.serializeUser(user),
    };
  }
}
