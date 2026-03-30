import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  SignUpDto,
  SignInDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  // Helper function to mock user data and token generation
  private mockUserResponse(accountType = 'standard') {
    return {
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      user: {
        id: 'usr_123',
        email: 'ana.laura@42.fr',
        fullName: 'Ana Laura',
        username: 'ana_laura',
        bio: '',
        avatarUrl: null,
        accountType,
      },
    };
  }

  signUp(dto: SignUpDto) {
    console.log('Received sign-up data:', dto);
    // TODO: Use Prisma to check if email or username already exists (Throw 409 Conflict if so).
    // TODO: Hash the dto.password using 'bcrypt' before saving.
    // TODO: Save the new user to the database.
    // TODO: Generate real JWT access and refresh tokens using @nestjs/jwt.
    return this.mockUserResponse();
  }

  signIn(dto: SignInDto) {
    // Mock: Only accept the contract's specific password for testing purposes
    if (dto.password !== 'StrongPassword123!') {
      throw new UnauthorizedException('Invalid credentials');
    }
    // TODO: Use Prisma to find the user by dto.email.
    // TODO: Compare dto.password with the hashed password in the DB using 'bcrypt'.
    // TODO: If valid, generate and return real JWT tokens.
    return this.mockUserResponse();
  }

  refresh(dto: RefreshTokenDto) {
    // Mocking the specific token string for tests
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
    return this.mockUserResponse('oauth_42');
  }
}
