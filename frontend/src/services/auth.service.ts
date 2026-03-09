import api from './api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', data);
    return res.data;
  },

  async register(data: Omit<RegisterRequest, 'confirmPassword'>): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/api/users/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('accessToken');
  },
};