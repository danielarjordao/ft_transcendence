import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service';

interface FormErrors {
  email?: string;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    return nextErrors;
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
      await authService.forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (err: any) {
      setServerError(
        err.response?.data?.message ||
          'Could not request a password reset right now. Please try again.',
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
            Forgot your password?
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 28 }}>
            Enter your email and we will send a reset link if the account exists.
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

          {isSubmitted ? (
            <div
              style={{
                background: '#102418',
                border: '1px solid #4BBE7D44',
                borderRadius: 8,
                padding: '12px 14px',
                color: '#9CE3B8',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              If an account matches this email, a password reset link is on its way.
            </div>
          ) : (
            <>
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
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                    setServerError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleSubmit();
                    }
                  }}
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
                  }}
                />
                {errors.email && (
                  <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 5 }}>
                    {errors.email}
                  </p>
                )}
              </div>

              <button
                onClick={() => void handleSubmit()}
                disabled={!email.trim() || isLoading}
                style={{
                  width: '100%',
                  padding: '11px 0',
                  borderRadius: 8,
                  border: 'none',
                  background: email.trim() && !isLoading ? '#FFFFFF' : '#2A2A2A',
                  color: email.trim() && !isLoading ? '#111111' : '#555',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: email.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  marginBottom: 12,
                }}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
          Remembered your password?{' '}
          <Link
            to="/login"
            style={{ color: '#CCCCCC', textDecoration: 'none', fontWeight: 500 }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
