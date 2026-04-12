import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
// bcrypt is a library to help you hash passwords. It provides a simple way to hash and compare passwords securely.
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

// Interface to define the structure of the user data that will be used in the mock response.
// TODO: This interface is only for the mock response and should be replaced with actual user data from the database in a real implementation.
interface MockUserPayload {
  id: string;
  email: string;
  fullName: string | null;
  username: string;
  accountType?: string;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper function to mock user data and token generation
  // TODO: This function is currently used to return a consistent response structure for testing purposes,
  // but in a real implementation, it would be replaced by actual JWTs generated based on the user's information and a secret key.
  private mockUserResponse(user: MockUserPayload, accountType = 'standard') {
    return {
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName || '',
        username: user.username,
        bio: '',
        avatarUrl: null,
        accountType: user.accountType || accountType,
      },
    };
  }

  async signUp(dto: SignUpDto) {
    console.log('Received sign-up data:', dto);

    // Check if a user with the same email or username already exists to prevent duplicates.
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { username: dto.username }],
      },
    });
    // If it exists, It is thrown a ConflictException to indicate that the email or username is already in use.
    if (existingUser) {
      throw new ConflictException('Email or username already in use');
    }

    // Hash the password using bcrypt before saving it to the database.
    // The '10' is the salt rounds, which determines the complexity of the hashing.
    // It is scaled from 10 to 12 for better security, but it also increases the time it takes to hash the password.
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Use Prisma to create a new user in the database with the provided data and the hashed password.
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        fullName: dto.fullName,
        // TODO: Add logic to determine accountType based on the registration method (e.g., 'standard' for email/password, 'oauth_42' for 42 OAuth).
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

    // TODO: Generate real JWT access and refresh tokens using @nestjs/jwt.
    // The mockUserResponse function is used to return a consistent response structure for testing purposes,
    // but in a real implementation, it would be replaced by the hardcoded tokens with actual JWTs generated based on the user's information and a secret key.
    return this.mockUserResponse({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      username: newUser.username,
      accountType: newUser.accountType,
    });
  }

  async signIn(dto: SignInDto) {
    // Find the user by email and include the associated auth accounts to access the hashed password.
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        authAccounts: {
          where: { provider: 'LOCAL' },
        },
      },
    });

    // If no user is found or if the user does not have a local auth account, throw an UnauthorizedException.
    if (!user || !user.authAccounts || user.authAccounts.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare the provided password with the stored hashed password using bcrypt's compare function.
    const authAccount = user.authAccounts[0];
    const storedHash = authAccount.passwordHash;

    if (!storedHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, storedHash);

    // If the passwords do not match, throw an UnauthorizedException.
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Generate real JWT access and refresh tokens using @nestjs/jwt.
    // The mockUserResponse function is used to return a consistent response structure for testing purposes,
    // but in a real implementation, it would be replaced by the hardcoded tokens with actual JWTs generated based on the user's information and a secret key.
    return this.mockUserResponse({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      accountType: user.accountType,
    });
  }

  refresh(dto: RefreshTokenDto) {
    // Mocking the specific token string for tests
    // TODO: In a real implementation, you would verify the provided refresh token using @nestjs/jwt and extract the user information from it to generate new tokens.
    if (dto.refreshToken !== 'jwt-refresh-token') {
      throw new UnauthorizedException('Token expired or invalid');
    }
    // TODO: Verify the provided refresh token using @nestjs/jwt.
    // TODO: Extract the user ID from the token payload, fetch user from DB.
    // TODO: Generate and return a new pair of tokens.
    return {
      accessToken: 'new-jwt-access-token',
      refreshToken: 'new-jwt-refresh-token',
    };
  }

  logout(dto: RefreshTokenDto) {
    console.log('Received logout request for token:', dto.refreshToken);
    // TODO: Verify the token and invalidate it (e.g., adding to a blacklist or removing from DB).
  }

  forgotPassword(dto: ForgotPasswordDto) {
    console.log('Received forgot password request for email:', dto.email);
    // TODO: Fetch user by email. If exists, generate a secure reset token.
    // TODO: Save the reset token and its expiration date in the DB.
    // TODO: Trigger the email sending service.
  }

  resetPassword(dto: ResetPasswordDto) {
    console.log('Received reset password request with token:', dto.token);
    // TODO: Find the user associated with the token in the DB. Check if token is expired.
    // TODO: Hash the dto.newPassword with 'bcrypt' and update the user record.
    // TODO: Invalidate/delete the used reset token.
  }

  oauth42Callback(code: string) {
    console.log('Received OAuth callback with code:', code);
    // TODO: Exchange the 'code' for an access token via the 42 API.
    // TODO: Fetch the user's profile from the 42 API.
    // TODO: Check if user exists in our DB. If not, create a new one with accountType 'oauth_42'.
    // TODO: Generate and return our own JWT tokens for the authenticated user.
    return this.mockUserResponse(
      {
        id: 'usr_oauth',
        email: 'oauth@42.fr',
        fullName: 'OAuth User',
        username: 'oauth_user',
      },
      'oauth_42',
    );
  }
}
