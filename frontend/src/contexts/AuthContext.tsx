import { createContext, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, login, logout: clearLocalAuth } = useAuthStore();

  const logout = useCallback(async () => {
    try {
      await authService.logout(useAuthStore.getState().refreshToken || undefined);
    } catch {
      // Local cleanup still happens even if the backend logout endpoint is unavailable.
    } finally {
      clearLocalAuth();
    }
  }, [clearLocalAuth]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
