import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import type { AuthResponse, SignInResponse } from '../types/auth';

interface FormErrors {
  email?: string;
  password?: string;
  twoFactorCode?: string;
}

function isTwoFactorChallengeResponse(
  response: SignInResponse,
): response is Extract<SignInResponse, { requiresTwoFactor: true }> {
  return 'requiresTwoFactor' in response && response.requiresTwoFactor === true;
}

function isAuthSuccessResponse(
  response: SignInResponse,
): response is AuthResponse {
  return !isTwoFactorChallengeResponse(response);
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const initialTwoFactorToken = searchParams.get('twoFactorToken') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState(initialTwoFactorToken);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const requiresTwoFactor = Boolean(twoFactorToken);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (requiresTwoFactor) {
      if (!twoFactorCode.trim()) e.twoFactorCode = '2FA code is required.';
      else if (!/^\d{6}$/.test(twoFactorCode.trim())) e.twoFactorCode = 'Enter a valid 6-digit code.';
      return e;
    }

    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password.trim()) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  };

  const handleBlur = (field: 'email' | 'password' | 'twoFactorCode') => {
    const e = validate();
    setErrors(prev => ({ ...prev, [field]: e[field] }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      if (requiresTwoFactor) {
        const res = await authService.signInWithTwoFactor(
          twoFactorToken,
          twoFactorCode.trim(),
        );
        login(res.accessToken, res.refreshToken, res.user);
        navigate(redirectTarget, { replace: true });
        return;
      }

      const res = await authService.login({ email, password });

      if (isTwoFactorChallengeResponse(res)) {
        setTwoFactorToken(res.twoFactorToken);
        setTwoFactorCode('');
        setErrors({});
        return;
      }

      if (isAuthSuccessResponse(res)) {
        login(res.accessToken, res.refreshToken, res.user);
        navigate(redirectTarget, { replace: true });
      }
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : err instanceof Error
          ? err.message
          : null;
      setServerError(msg ?? 'Credenciais inválidas. Tenta novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth42 = () => {
    if (redirectTarget && redirectTarget !== '/dashboard') {
      sessionStorage.setItem('postAuthRedirect', redirectTarget);
    } else {
      sessionStorage.removeItem('postAuthRedirect');
    }
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/42`;
  };

  const isFormValid = requiresTwoFactor
    ? /^\d{6}$/.test(twoFactorCode.trim())
    : email.trim() && password.trim() && password.length >= 8;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36, justifyContent: 'center' }}>
          <div style={{ width: 38, height: 38, background: '#7B68EE', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>fz</span>
          </div>
          <span style={{ color: '#EEEEEE', fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px' }}>fazelo</span>
        </div>

        {/* Card */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: 14,
          padding: '32px 28px',
        }}>
          <h1 style={{ color: '#EEEEEE', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            {requiresTwoFactor ? 'Two-factor authentication' : 'Welcome back'}
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>
            {requiresTwoFactor
              ? 'Enter the 6-digit code from your authenticator app to complete sign in.'
              : 'Sign in to your account to continue'}
          </p>

          {/* Server error */}
          {serverError && (
            <div style={{
              background: '#2A1010',
              border: '1px solid #FF6B6B44',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 20,
              color: '#FF6B6B',
              fontSize: 13,
            }}>
              {serverError}
            </div>
          )}

          {requiresTwoFactor ? (
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={twoFactorCode}
                onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onBlur={() => handleBlur('twoFactorCode')}
                placeholder="123456"
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                style={{
                  width: '100%',
                  background: '#222222',
                  border: `1px solid ${errors.twoFactorCode ? '#FF6B6B' : '#3A3A3A'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#EEEEEE',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
              />
              {errors.twoFactorCode && (
                <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.twoFactorCode}</p>
              )}
              <button
                onClick={() => {
                  setTwoFactorToken('');
                  setTwoFactorCode('');
                  setErrors({});
                  setServerError('');
                }}
                style={{
                  marginTop: 12,
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  color: '#888',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="you@example.com"
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: `1px solid ${errors.email ? '#FF6B6B' : '#3A3A3A'}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#EEEEEE',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { if (!errors.email) e.target.style.borderColor = '#555'; }}
                  onBlurCapture={e => { if (!errors.email) e.target.style.borderColor = '#3A3A3A'; }}
                />
                {errors.email && (
                  <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ color: '#888', fontSize: 12, fontWeight: 500 }}>
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    style={{ color: '#888', fontSize: 12, textDecoration: 'none', fontWeight: 500 }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                  style={{
                    width: '100%',
                    background: '#222222',
                    border: `1px solid ${errors.password ? '#FF6B6B' : '#3A3A3A'}`,
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#EEEEEE',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { if (!errors.password) e.target.style.borderColor = '#555'; }}
                  onBlurCapture={e => { if (!errors.password) e.target.style.borderColor = '#3A3A3A'; }}
                />
                {errors.password && (
                  <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.password}</p>
                )}
              </div>
            </>
          )}

          {/* Sign in button */}
          <button
            onClick={() => handleSubmit()}
            disabled={!isFormValid || isLoading}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 8,
              border: 'none',
              background: isFormValid && !isLoading ? '#FFFFFF' : '#2A2A2A',
              color: isFormValid && !isLoading ? '#111111' : '#555',
              fontSize: 14,
              fontWeight: 600,
              cursor: isFormValid && !isLoading ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s, color 0.15s',
              marginBottom: 12,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {!requiresTwoFactor && (
            <>
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#2A2A2A' }} />
                <span style={{ color: '#444', fontSize: 12 }}>or</span>
                <div style={{ flex: 1, height: 1, background: '#2A2A2A' }} />
              </div>

              {/* OAuth 42 button */}
              <button
                onClick={handleOAuth42}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 8,
                  border: '1px solid #3A3A3A',
                  background: 'transparent',
                  color: '#CCCCCC',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.background = '#222'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontWeight: 700, fontSize: 13 }}>42</span>
                Continue with 42
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {!requiresTwoFactor && (
          <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
            Don't have an account?{' '}
            <Link
              to={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
              style={{ color: '#CCCCCC', textDecoration: 'none', fontWeight: 500 }}
            >
              Sign up
            </Link>
          </p>
        )}

      </div>
    </div>
  );
}
