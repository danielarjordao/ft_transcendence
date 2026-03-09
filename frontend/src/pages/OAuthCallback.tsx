import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }
    authService.getMe().then((user) => {
      login(token, user);
      navigate('/dashboard');
    }).catch(() => navigate('/login'));
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <span style={{ color: '#888', fontSize: 14 }}>Authenticating...</span>
    </div>
  );
}