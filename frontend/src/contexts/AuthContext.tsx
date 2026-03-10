import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // versão produção — reativar antes de commitar
  // const [user, setUser] = useState<User | null>(null);

  // versão teste local — comentar antes de commitar
  const [user, setUser] = useState<User | null>({
    id: '1',
    fullName: 'Ana Laura',
    username: 'ana',
    email: 'ana@test.com',
    avatarUrl: null,
    accountType: 'standard',
    createdAt: new Date().toISOString(),
  });

  // TODO: reativar quando GET /api/users/me estiver pronto
  // const [isLoading, setIsLoading] = useState(true);
  // useEffect(() => { getMe().then(...).finally(() => setIsLoading(false)) }, []);

  const login = (token: string, userData: User) => {
    localStorage.setItem('accessToken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading: false, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}