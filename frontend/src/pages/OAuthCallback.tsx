import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const oauthError = params.get('error');

  useEffect(() => {
    if (oauthError) {
      sessionStorage.removeItem('postAuthRedirect');
      navigate('/login', { replace: true });
      return;
    }

    const postAuthRedirect =
      sessionStorage.getItem('postAuthRedirect') || '/dashboard';
    sessionStorage.removeItem('postAuthRedirect');

    let isActive = true;

    const finalizeOAuthSession = async () => {
      try {
        const tokens = await authService.refresh();
        const user = await authService.getMe();

        if (!isActive) {
          return;
        }

        login(tokens.accessToken, tokens.refreshToken, user);
        navigate(postAuthRedirect, { replace: true });
      } catch {
        if (isActive) {
          navigate('/login', { replace: true });
        }
      }
    };

    void finalizeOAuthSession();

    return () => {
      isActive = false;
    };
  }, [login, navigate, oauthError]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
      <span style={{ color: '#888', fontSize: 14 }}>Authenticating...</span>
    </div>
  );
}
