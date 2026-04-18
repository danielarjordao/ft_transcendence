import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // Centralized token generation ensures both tokens are created atomically
  // and signed with their respective environment secrets.
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const accessSecret: string =
      process.env.JWT_ACCESS_SECRET || 'default_dev_secret';
    const refreshSecret: string =
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async signUp(dto: SignUpDto) {
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

    // TODO: [Feature - Session Management] Hash the generated refreshToken and store it in the database.
    // This allows the system to revoke specific tokens during the logout process.

    return {
      ...tokens,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName || '',
        username: newUser.username,
        bio: '',
        avatarUrl: null,
        accountType: newUser.accountType,
      },
    };
  }

  async signIn(dto: SignInDto) {
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

    // TODO: [Feature - Session Management] Hash and store the generated refreshToken in the database.

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || '',
        username: user.username,
        bio: '',
        avatarUrl: null,
        accountType: user.accountType,
      },
    };
  }

  refresh(_dto: RefreshTokenDto) {
    // TODO: [Feature - Session Management] Verify the provided refresh token signature using @nestjs/jwt.
    // TODO: [Feature - Session Management] Extract the payload, fetch the user, and validate against the stored hash.
    // TODO: [Feature - Session Management] Generate and return a new token pair.

    throw new NotImplementedException(
      'Refresh Token method not implemented yet.',
    );
  }

  logout(_dto: RefreshTokenDto) {
    // TODO: [Feature - Session Management] Verify the token and invalidate it by removing its hash from the database.
    throw new NotImplementedException('Logout method not implemented yet.');
  }

  forgotPassword(_dto: ForgotPasswordDto) {
    // TODO: [Feature - Password Reset] Fetch user by email. If exists, generate a cryptographically secure reset token.
    // TODO: [Feature - Password Reset] Persist the reset token and expiration date in the database.
    // TODO: [Feature - Notifications] Trigger the external email sending service (e.g., Nodemailer/SendGrid).
    throw new NotImplementedException(
      'Forgot Password method not implemented yet.',
    );
  }

  resetPassword(_dto: ResetPasswordDto) {
    // TODO: [Feature - Password Reset] Find the user associated with the token. Validate expiration.
    // TODO: [Feature - Password Reset] Hash the new password with bcrypt and update the database record.
    // TODO: [Feature - Password Reset] Invalidate and delete the used reset token.
    throw new NotImplementedException(
      'Reset Password method not implemented yet.',
    );
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
