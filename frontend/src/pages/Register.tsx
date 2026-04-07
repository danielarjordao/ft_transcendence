import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

interface FormFields {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState<FormFields>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const set = (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    else if (form.fullName.trim().length < 2) e.fullName = 'Minimum 2 characters.';

    if (!form.username.trim()) e.username = 'Username is required.';
    else if (form.username.trim().length < 3) e.username = 'Minimum 3 characters.';
    else if (form.username.trim().length > 30) e.username = 'Maximum 30 characters.';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) e.username = 'Letters, numbers and underscores only.';

    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';

    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters.';
    else if (!/\d/.test(form.password)) e.password = 'Must contain at least one number.';

    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';

    return e;
  };

  const handleBlur = (field: keyof FormFields) => {
    const e = validate();
    setErrors(prev => ({ ...prev, [field]: e[field] }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      const res = await authService.register({
        email: form.email,
        username: form.username,
        password: form.password,
        fullName: form.fullName,
      });
      login(res.accessToken, res.refreshToken, res.user);
      navigate('/dashboard');
    } catch (err: any) {
      const status = err.response?.status;
      const type = err.response?.data?.type;

      if (status === 409 && type === 'username_taken') {
        setErrors(prev => ({ ...prev, username: 'Este username já está em uso.' }));
      } else {
        setServerError(err.response?.data?.message ?? 'Erro ao criar conta. Tenta novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid =
    form.fullName.trim() &&
    form.username.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.password === form.confirmPassword;

  const inputStyle = (field: keyof FormErrors) => ({
    width: '100%',
    background: '#222222',
    border: `1px solid ${errors[field] ? '#FF6B6B' : '#3A3A3A'}`,
    borderRadius: 8,
    padding: '10px 12px',
    color: '#EEEEEE',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  });

  const labelStyle = {
    display: 'block',
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 500,
  } as const;

  const fieldWrap = { marginBottom: 16 };

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
          <h1 style={{ color: '#EEEEEE', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Create an account</h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>Join fazelo and start collaborating</p>

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

          {/* Full Name */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={set('fullName')}
              onBlur={() => handleBlur('fullName')}
              placeholder="Ana Laura"
              style={inputStyle('fullName')}
            />
            {errors.fullName && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.fullName}</p>}
          </div>

          {/* Username */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={form.username}
              onChange={set('username')}
              onBlur={() => handleBlur('username')}
              placeholder="ana_laura"
              style={inputStyle('username')}
            />
            {errors.username && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.username}</p>}
          </div>

          {/* Email */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              onBlur={() => handleBlur('email')}
              placeholder="you@example.com"
              style={inputStyle('email')}
            />
            {errors.email && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div style={fieldWrap}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              onBlur={() => handleBlur('password')}
              placeholder="••••••••"
              style={inputStyle('password')}
            />
            {errors.password && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={set('confirmPassword')}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="••••••••"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
              style={inputStyle('confirmPassword')}
            />
            {errors.confirmPassword && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>{errors.confirmPassword}</p>}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
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
            }}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#CCCCCC', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}