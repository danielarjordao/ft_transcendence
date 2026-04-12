import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

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

  async logout(refreshToken: string): Promise<void> {
    // TODO: backend integration — POST /auth/logout
    await api.post('/auth/logout', { refreshToken });
  },
};