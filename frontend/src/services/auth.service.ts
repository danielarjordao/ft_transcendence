import api from './api';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenPairResponse,
  User,
} from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    // TODO: backend integration — POST /auth/sign-in
    const res = await api.post<AuthResponse>('/auth/sign-in', data);
    return res.data;
  },

  async register(data: Omit<RegisterRequest, 'confirmPassword'>): Promise<AuthResponse> {
    // TODO: backend integration — POST /auth/sign-up
    const res = await api.post<AuthResponse>('/auth/sign-up', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    // TODO: backend integration — GET /users/me
    const res = await api.get<User>('/users/me');
    return res.data;
  },

  async refresh(refreshToken?: string): Promise<TokenPairResponse> {
    const res = await api.post<TokenPairResponse>(
      '/auth/refresh',
      refreshToken ? { refreshToken } : {},
      { skipAuthRefresh: true },
    );

    return res.data;
  },

  async logout(refreshToken?: string): Promise<void> {
    // TODO: backend integration — POST /auth/logout
    await api.post(
      '/auth/logout',
      refreshToken ? { refreshToken } : {},
      { skipAuthRefresh: true },
    );
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post(
      '/auth/forgot-password',
      { email },
      { skipAuthRefresh: true },
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post(
      '/auth/reset-password',
      { token, newPassword },
      { skipAuthRefresh: true },
    );
  },
};
