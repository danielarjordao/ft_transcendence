import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: localStorage.getItem('accessToken'),
      isLoading: false,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ accessToken: token }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (token, user) => {
        // salva nas duas chaves: Zustand usa 'fazelo-auth', SocketContext usa 'accessToken'
        localStorage.setItem('accessToken', token);
        set({ accessToken: token, user });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ accessToken: null, user: null });
      },
    }),
    {
      name: 'fazelo-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        // quando o Zustand reidrata, sincroniza o accessToken no localStorage
        if (state?.accessToken) {
          localStorage.setItem('accessToken', state.accessToken);
        }
      },
    }
  )
);