import { create } from 'zustand';
import type { User } from '../types/auth';

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  ready: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

function persistUser(user: User | null) {
  if (user) {
    localStorage.setItem('fazelo-user', JSON.stringify(user));
    return;
  }

  localStorage.removeItem('fazelo-user');
}

function persistTokens(
  accessToken: string | null,
  refreshToken: string | null,
) {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  } else {
    localStorage.removeItem('accessToken');
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

function getInitialState() {
  const accessToken  = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userStr      = localStorage.getItem('fazelo-user');
  const user         = userStr ? (JSON.parse(userStr) as User) : null;
  return { accessToken, refreshToken, user };
}

export const useAuthStore = create<AuthState>()((set) => ({
  ...getInitialState(),
  isLoading: false,
  ready: true,

  setUser: (user) => {
    persistUser(user);
    set({ user });
  },
  setTokens: (accessToken, refreshToken) => {
    persistTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken });
  },
  setLoading: (isLoading) => set({ isLoading }),

  login: (accessToken, refreshToken, user) => {
    persistTokens(accessToken, refreshToken);
    persistUser(user);
    set({ accessToken, refreshToken, user });
  },

  logout: () => {
    persistTokens(null, null);
    persistUser(null);
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
