import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const missingToken = useMemo(() => !token.trim(), [token]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!newPassword) {
      nextErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      nextErrors.newPassword = 'Minimum 8 characters.';
    } else if (!/(?=.*[A-Za-z])(?=.*\d).+/.test(newPassword)) {
      nextErrors.newPassword = 'Password must contain at least one letter and one number.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    return nextErrors;
  };

  const handleSubmit = async () => {
    if (missingToken) {
      setServerError('Reset link is missing its token.');
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      await authService.resetPassword(token, newPassword);
      setSuccessMessage('Password updated successfully. You can sign in now.');
      redirectTimeoutRef.current = setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message ||
          'Could not reset the password. Please request a new link.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 36,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              background: '#7B68EE',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>
              fz
            </span>
          </div>
          <span
            style={{
              color: '#EEEEEE',
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.3px',
            }}
          >
            fazelo
          </span>
        </div>

        <div
          style={{
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: 14,
            padding: '32px 28px',
          }}
        >
          <h1
            style={{
              color: '#EEEEEE',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Reset your password
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>
            Choose a new password for your account.
          </p>

          {serverError && (
            <div
              style={{
                background: '#2A1010',
                border: '1px solid #FF6B6B44',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 20,
                color: '#FF6B6B',
                fontSize: 13,
              }}
            >
              {serverError}
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: '#102418',
                border: '1px solid #4BBE7D44',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
                color: '#9CE3B8',
                fontSize: 13,
              }}
            >
              {successMessage}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                color: '#888',
                fontSize: 12,
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setErrors((prev) => ({ ...prev, newPassword: undefined }));
                setServerError('');
              }}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#222222',
                border: `1px solid ${errors.newPassword ? '#FF6B6B' : '#3A3A3A'}`,
                borderRadius: 8,
                padding: '10px 12px',
                color: '#EEEEEE',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.newPassword && (
              <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>
                {errors.newPassword}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                color: '#888',
                fontSize: 12,
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                setServerError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSubmit();
                }
              }}
              placeholder="••••••••"
              style={{
                width: '100%',
                background: '#222222',
                border: `1px solid ${errors.confirmPassword ? '#FF6B6B' : '#3A3A3A'}`,
                borderRadius: 8,
                padding: '10px 12px',
                color: '#EEEEEE',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.confirmPassword && (
              <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            onClick={() => void handleSubmit()}
            disabled={missingToken || isLoading}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 8,
              border: 'none',
              background: !missingToken && !isLoading ? '#FFFFFF' : '#2A2A2A',
              color: !missingToken && !isLoading ? '#111111' : '#555',
              fontSize: 14,
              fontWeight: 600,
              cursor: !missingToken && !isLoading ? 'pointer' : 'not-allowed',
              marginBottom: 12,
            }}
          >
            {isLoading ? 'Updating...' : 'Update password'}
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
          Back to{' '}
          <Link
            to="/login"
            style={{ color: '#CCCCCC', textDecoration: 'none', fontWeight: 500 }}
          >
            sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
