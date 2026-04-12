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

  // Helper method to generate JWT access and refresh tokens.
  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    // Use environment variables for secrets, with fallback defaults for development.
    const accessSecret: string =
      process.env.JWT_ACCESS_SECRET || 'default_dev_secret';
    const refreshSecret: string =
      process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';

    const [accessToken, refreshToken] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1h',
      }) as Promise<string>,

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }) as Promise<string>,
    ]);

    return { accessToken, refreshToken };
  }

  async signUp(dto: SignUpDto) {
    console.log('Received sign-up data:', dto);

    // Check if a user with the same email or username already exists.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already in use');
    }

    // Hash the password using bcrypt. Salt rounds set to 10.
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create a new user in the database.
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        // TODO: Add logic to determine accountType based on the registration method.
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

    // Generate real JWT tokens.
    const tokens = await this.generateTokens(newUser.id, newUser.email);

    // TODO: Hash the generated refreshToken and store it in the database (e.g., Session table) linked to the user.
    // This is required to allow token revocation during logout

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
    // Find the user by email and include the local auth account.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        authAccounts: {
          where: { provider: 'LOCAL' },
        },
      },
    });

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

    // TODO: Check if the user has 2FA enabled. If yes, instead of returning the full tokens,
    // return a partial token or a specific response indicating that a 2FA OTP code is required.

    // Generate real JWT tokens.
    const tokens = await this.generateTokens(user.id, user.email);

    // TODO: Hash the generated refreshToken and store it in the database (e.g., Session table) linked to the user.
    // This is required to allow token revocation during logout
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

  refresh(dto: RefreshTokenDto) {
    // TODO: Verify the provided refresh token using @nestjs/jwt.
    // TODO: Extract the user ID from the token payload, fetch user from DB.
    // TODO: Generate and return a new pair of tokens.
    console.log('Received refresh token:', dto.refreshToken);
    throw new NotImplementedException(
      'Refresh Token method not implemented yet.',
    );
  }

  logout(dto: RefreshTokenDto) {
    console.log('Received logout request for token:', dto.refreshToken);
    // TODO: Verify the token and invalidate it (e.g., adding to a blacklist or removing from DB).
    throw new NotImplementedException('Logout method not implemented yet.');
  }

  forgotPassword(dto: ForgotPasswordDto) {
    console.log('Received forgot password request for email:', dto.email);
    // TODO: Fetch user by email. If exists, generate a secure reset token.
    // TODO: Save the reset token and its expiration date in the DB.
    // TODO: Trigger the email sending service.
    throw new NotImplementedException(
      'Forgot Password method not implemented yet.',
    );
  }

  resetPassword(dto: ResetPasswordDto) {
    console.log('Received reset password request with token:', dto.token);
    // TODO: Find the user associated with the token in the DB. Check if token is expired.
    // TODO: Hash the dto.newPassword with 'bcrypt' and update the user record.
    // TODO: Invalidate/delete the used reset token.
    throw new NotImplementedException(
      'Reset Password method not implemented yet.',
    );
  }

  oauth42Callback(code: string) {
    console.log('Received OAuth callback with code:', code);
    // TODO: Exchange the 'code' for an access token via the 42 API.
    // TODO: Fetch the user's profile from the 42 API.
    // TODO: Check if user exists in our DB. If not, create a new one with accountType 'oauth_42'.
    // TODO: Generate and return our own JWT tokens for the authenticated user.
    throw new NotImplementedException(
      'OAuth42 Callback method not implemented yet.',
    );
  }
}
