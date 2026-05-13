export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl: string | null;
  accountType: 'standard' | 'oauth_42' | 'oauth_google' | 'oauth_github';
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

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

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
