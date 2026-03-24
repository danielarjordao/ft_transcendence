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
  // Auxiliar function to simulate user data and token generation
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
    return this.mockUserResponse();
  }

  signIn(dto: SignInDto) {
    // Mock: só aceitamos a senha do contrato para testes
    if (dto.password !== 'StrongPassword123!') {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.mockUserResponse();
  }

  refresh(dto: RefreshTokenDto) {
    if (dto.refreshToken !== 'seu_refresh_token_aqui') {
      throw new UnauthorizedException('Token expired or invalid');
    }
    return {
      accessToken: 'new-jwt-access-token',
      refreshToken: 'new-jwt-refresh-token',
    };
  }

  logout(dto: RefreshTokenDto) {
    console.log('Received logout request for token:', dto.refreshToken);
    // Success - no content returned (204)
  }

  forgotPassword(dto: ForgotPasswordDto) {
    console.log('Received forgot password request for email:', dto.email);
    // Success - no content returned (204)
  }

  resetPassword(dto: ResetPasswordDto) {
    console.log('Received reset password request with token:', dto.token);
    // Success - no content returned (204)
  }

  oauth42Callback(code: string) {
    // Mock implementation: in a real scenario, you would exchange the code for an access token and fetch user info from 42's API
    console.log('Received OAuth callback with code:', code);
    return this.mockUserResponse('oauth_42');
  }
}
