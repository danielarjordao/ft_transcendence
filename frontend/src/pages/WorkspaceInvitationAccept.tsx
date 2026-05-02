import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  workspaceInvitationsService,
  type WorkspaceInvitationView,
} from '../services/workspace-invitations.service';

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

export default function WorkspaceInvitationAccept() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const token = params.get('token') || '';
  const redirectTarget = useMemo(
    () => `${location.pathname}${location.search}`,
    [location.pathname, location.search],
  );

  const [invitation, setInvitation] = useState<WorkspaceInvitationView | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [hasAttemptedClaim, setHasAttemptedClaim] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setInvitation(null);
      setError('Invitation link is missing a token.');
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError('');
    setHasAttemptedClaim(false);

    workspaceInvitationsService
      .preview(token)
      .then((result) => {
        if (!active) {
          return;
        }

        setInvitation(result);
      })
      .catch((err: any) => {
        if (!active) {
          return;
        }

        setInvitation(null);
        setError(err.response?.data?.message || 'Invitation not found.');
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (
      !isAuthenticated ||
      !user ||
      !token ||
      !invitation ||
      invitation.status !== 'pending' ||
      invitation.isExpired ||
      hasAttemptedClaim
    ) {
      return;
    }

    setHasAttemptedClaim(true);
    setIsClaiming(true);
    setError('');

    workspaceInvitationsService
      .claim(token)
      .then((result) => {
        setInvitation(result);
      })
      .catch((err: any) => {
        setError(
          err.response?.data?.message ||
            'We could not link this invitation to your account.',
        );
      })
      .finally(() => {
        setIsClaiming(false);
      });
  }, [hasAttemptedClaim, invitation, isAuthenticated, token, user]);

  const handleAuthRedirect = (target: 'login' | 'register') => {
    navigate(`/${target}?redirect=${encodeURIComponent(redirectTarget)}`);
  };

  const handleResponse = async (action: 'accept' | 'decline') => {
    if (!invitation) {
      return;
    }

    setIsResponding(true);
    setError('');
    setSuccess('');

    try {
      const result = await workspaceInvitationsService.respond(
        invitation.id,
        action,
      );
      setInvitation(result);
      setSuccess(
        action === 'accept'
          ? 'You joined the workspace successfully.'
          : 'Invitation declined.',
      );
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'We could not update this invitation right now.',
      );
    } finally {
      setIsResponding(false);
    }
  };

  const roleLabel = invitation?.role === 'admin' ? 'Admin' : 'Member';
  const inviterName =
    invitation?.inviter?.fullName || invitation?.inviter?.username || 'A teammate';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 28,
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
            padding: '28px',
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
            Workspace invitation
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24 }}>
            Review the invite and continue with the account that matches the
            invited email.
          </p>

          {(error || success) && (
            <div
              style={{
                background: error ? '#2A1010' : '#102417',
                border: `1px solid ${error ? '#FF6B6B44' : '#50C87844'}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 20,
                color: error ? '#FF6B6B' : '#50C878',
                fontSize: 13,
              }}
            >
              {error || success}
            </div>
          )}

          {isLoading ? (
            <p style={{ color: '#888', fontSize: 14 }}>Loading invitation...</p>
          ) : invitation ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gap: 14,
                  border: '1px solid #2A2A2A',
                  borderRadius: 10,
                  padding: '16px 18px',
                  marginBottom: 22,
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Workspace
                  </div>
                  <div style={{ color: '#EEEEEE', fontSize: 15, fontWeight: 600 }}>
                    {invitation.workspaceName || 'Untitled workspace'}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Invited by
                  </div>
                  <div style={{ color: '#CCCCCC', fontSize: 14 }}>
                    {inviterName}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div
                      style={{
                        color: '#666',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Role
                    </div>
                    <div style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {roleLabel}
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        color: '#666',
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Email
                    </div>
                    <div style={{ color: '#CCCCCC', fontSize: 14 }}>
                      {invitation.inviteeEmail}
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      color: '#666',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Expires
                  </div>
                  <div style={{ color: '#CCCCCC', fontSize: 14 }}>
                    {formatDate(invitation.expiresAt) || 'No expiration'}
                  </div>
                </div>
              </div>

              {!isAuthenticated ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    onClick={() => handleAuthRedirect('login')}
                    style={{
                      width: '100%',
                      padding: '11px 0',
                      borderRadius: 8,
                      border: 'none',
                      background: '#FFFFFF',
                      color: '#111111',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sign in to continue
                  </button>
                  <button
                    onClick={() => handleAuthRedirect('register')}
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
                    }}
                  >
                    Create account with invited email
                  </button>
                </div>
              ) : isClaiming ? (
                <p style={{ color: '#888', fontSize: 14 }}>
                  Verifying invitation for {user?.email || 'your account'}...
                </p>
              ) : invitation.status !== 'pending' ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <p style={{ color: '#CCCCCC', fontSize: 14 }}>
                    This invitation has already been {invitation.status}.
                  </p>
                  {invitation.status === 'accepted' ? (
                    <button
                      onClick={() => navigate(`/board/${invitation.workspaceId}`)}
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
                      }}
                    >
                      Go to workspace
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/dashboard')}
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
                      }}
                    >
                      Back to dashboard
                    </button>
                  )}
                </div>
              ) : invitation.isExpired ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <p style={{ color: '#CCCCCC', fontSize: 14 }}>
                    This invitation link has expired. Ask the workspace owner to
                    send a new one.
                  </p>
                  <button
                    onClick={() => navigate('/dashboard')}
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
                    }}
                  >
                    Back to dashboard
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  <button
                    onClick={() => handleResponse('accept')}
                    disabled={isResponding}
                    style={{
                      width: '100%',
                      padding: '11px 0',
                      borderRadius: 8,
                      border: 'none',
                      background: '#FFFFFF',
                      color: '#111111',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isResponding ? 'wait' : 'pointer',
                    }}
                  >
                    {isResponding ? 'Updating...' : 'Accept invitation'}
                  </button>
                  <button
                    onClick={() => handleResponse('decline')}
                    disabled={isResponding}
                    style={{
                      width: '100%',
                      padding: '11px 0',
                      borderRadius: 8,
                      border: '1px solid #3A3A3A',
                      background: 'transparent',
                      color: '#CCCCCC',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isResponding ? 'wait' : 'pointer',
                    }}
                  >
                    Decline invitation
                  </button>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#888', fontSize: 14 }}>
              This invitation could not be loaded.
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontSize: 13, marginTop: 20 }}>
          Need a fresh start?{' '}
          <Link to="/dashboard" style={{ color: '#CCCCCC', textDecoration: 'none' }}>
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
