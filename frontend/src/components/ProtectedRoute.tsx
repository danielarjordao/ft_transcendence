import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) return (
    <div style={{ minHeight: '100vh', background: '#111111' }} />
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}