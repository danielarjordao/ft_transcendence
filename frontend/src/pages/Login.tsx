import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

interface FormErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password.trim()) e.password = 'Password is required.';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    return e;
  };

  const handleBlur = (field: 'email' | 'password') => {
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
      const res = await authService.login({ email, password });
      login(res.accessToken, res.refreshToken, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setServerError(msg ?? 'Credenciais inválidas. Tenta novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth42 = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/42`;
  };

  const isFormValid = email.trim() && password.trim() && password.length >= 8;

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
          <h1 style={{ color: '#EEEEEE', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>Sign in to your account to continue</p>

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
            <label style={{ display: 'block', color: '#888', fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              Password
            </label>
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
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#CCCCCC', textDecoration: 'none', fontWeight: 500 }}>
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}