export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl: string | null;
  accountType: 'standard' | 'oauth_42' | 'oauth_google' | 'oauth_github';
  twoFactorEnabled: boolean;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorChallengeResponse {
  requiresTwoFactor: true;
  twoFactorToken: string;
}

export type SignInResponse = AuthResponse | TwoFactorChallengeResponse;

export interface TokenPairResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ProfileUpdateRequest {
  fullName: string;
  username: string;
  bio: string;
}

export interface ProfileUpdateResponse {
  id: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl: string | null;
}

export interface AvatarUploadResponse {
  avatarUrl: string | null;
}
