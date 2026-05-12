import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ProfilePanel } from '../components/ProfilePanel';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspaceStore } from '../store/workspace.store';
import ChatPanel from '../components/chat/ChatPanel';
import { totalUnread } from '../constants/chat';

// ── Theme ─────────────────────────────────────────────────────────────────────
const T = {
  bg: '#111111',
  surface: '#1A1A1A',
  elevated: '#222222',
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  text: '#CCCCCC',
  dim: '#555555',
  bright: '#EEEEEE',
  primary: '#7B68EE',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const IconCheckSquare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

// ── User Avatar ───────────────────────────────────────────────────────────────
function UserAvatar({ user, size = 96 }: { user: any; size?: number }) {
  const initials = user?.fullName
    ?.split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: user?.avatarUrl ? 'transparent' : '#2A2A3A',
        border: `3px solid ${T.borderLight}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt="avatar"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.35, fontWeight: 700, color: '#CCCCDD' }}>
          {initials}
        </span>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: T.elevated,
          border: `1px solid ${T.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: T.primary,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: T.dim, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
          {label}
        </p>
        <p style={{ color: T.bright, fontSize: 20, fontWeight: 700 }}>{value}</p>
      </div>
    </div>
  );
}

// ── Workspace Card ────────────────────────────────────────────────────────────
function WorkspaceCard({ workspace, onClick }: { workspace: any; onClick: () => void }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hov ? T.borderLight : T.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: workspace.accent + '22',
          border: `1px solid ${workspace.accent}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: workspace.accent, fontSize: 16, fontWeight: 800 }}>
          {workspace.label}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: T.bright, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {workspace.name}
        </p>
        <p style={{ color: T.dim, fontSize: 12, marginTop: 2 }}>
          {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''} · {workspace.taskCount} task{workspace.taskCount !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Calcular tasks atribuídas (mock por agora, depois virá de GET /api/users/me)
  // TODO: Quando backend estiver pronto, substituir por: user.assignedTasksCount
  const assignedTasksCount = 0;

  const joinedDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <Navbar onOpenProfile={() => setProfileOpen(true)} onOpenChat={() => setChatOpen(true)} chatUnreadCount={totalUnread} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          
          {/* Header com Avatar */}
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: '32px 28px',
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <UserAvatar user={user} size={96} />
            
            <h1 style={{ color: T.bright, fontSize: 22, fontWeight: 700, marginTop: 16, marginBottom: 4 }}>
              {user?.fullName}
            </h1>
            
            <p style={{ color: T.dim, fontSize: 14, marginBottom: 16 }}>
              @{user?.username}
            </p>

            {user?.bio && (
              <p style={{ color: T.text, fontSize: 14, lineHeight: 1.6, maxWidth: 480, marginBottom: 16 }}>
                {user.bio}
              </p>
            )}

            <div style={{ display: 'flex', gap: 24, fontSize: 13, color: T.dim, marginBottom: 20 }}>
              <span>{user?.email}</span>
              <span>·</span>
              <span>Joined {joinedDate}</span>
            </div>

            <button
              onClick={() => setProfileOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: `1px solid ${T.borderLight}`,
                background: 'transparent',
                color: T.text,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.primary;
                e.currentTarget.style.color = T.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.borderLight;
                e.currentTarget.style.color = T.text;
              }}
            >
              <IconEdit />
              Edit Profile
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <StatCard
              icon={<IconBriefcase />}
              label="Workspaces"
              value={workspaces.length}
            />
            <StatCard
              icon={<IconCheckSquare />}
              label="Tasks Assigned"
              value={assignedTasksCount}
            />
          </div>

          {/* Workspaces */}
          <div>
            <h2 style={{ color: T.bright, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              My Workspaces
            </h2>

            {workspaces.length === 0 ? (
              <div
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: 10,
                  padding: '40px 20px',
                  textAlign: 'center',
                }}
              >
                <p style={{ color: T.dim, fontSize: 14 }}>No workspaces yet.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={{
                    marginTop: 12,
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    background: T.primary,
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create your first workspace
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {workspaces.map((ws) => (
                  <WorkspaceCard
                    key={ws.id}
                    workspace={ws}
                    onClick={() => navigate(`/board/${ws.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} currentUserId={user?.id || '1'} />
    </div>
  );
}