import { create } from 'zustand';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  ready: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
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

  setUser:    (user)    => set({ user }),
  setToken:   (token)   => set({ accessToken: token }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('fazelo-user',  JSON.stringify(user));
    set({ accessToken, refreshToken, user });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('fazelo-user');
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));