import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfilePanel } from '../components/ProfilePanel';
import { useAuth } from '../contexts/AuthContext';

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
const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);
const IconSearch = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconStar = ({ filled }: { filled?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={filled ? '#FFA500' : 'none'} stroke={filled ? '#FFA500' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IconMessage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

// ── Mock workspaces ───────────────────────────────────────────────────────────
const mockWorkspaces = [
  { id: 'ws1', name: 'ft_transcendence', accent: '#7B68EE', label: 'F', time: '2 hours ago', members: ['A','L','M'], starred: true },
  { id: 'ws2', name: 'Piscine Projects', accent: '#4A90D9', label: 'P', time: '3 days ago', members: ['A','L'], starred: false },
];

// ── Mini Kanban Preview ───────────────────────────────────────────────────────
function MiniKanban({ accent }: { accent: string }) {
  const cols = [
    { label: 'TO DO', bars: [100, 60, 40] },
    { label: 'IN PROGRESS', bars: [80, 50] },
    { label: 'DONE', bars: [90] },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '22px 16px 12px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      {cols.map((col, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 7, color: T.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{col.label}</span>
          {col.bars.map((w, j) => (
            <div key={j} style={{ height: 18, background: T.elevated, borderRadius: 3, border: `1px solid ${T.border}`, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, width: `${w}%`, background: accent + '30', borderRadius: 3 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Workspace Card ────────────────────────────────────────────────────────────
function WorkspaceCard({ ws, onToggleStar }: {
  ws: typeof mockWorkspaces[0];
  onToggleStar: (id: string) => void;
}) {
const navigate = useNavigate();
  const [hov, setHov] = useState(false);
  const [starHov, setStarHov] = useState(false);

  return (
    <div
onClick={() => navigate(`/board/${ws.id}`)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.surface, border: `1px solid ${hov ? T.borderLight : T.border}`,
        borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: hov ? '0 4px 24px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ height: 160, background: T.bg, position: 'relative', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ws.accent, borderRadius: '12px 12px 0 0' }} />
        <MiniKanban accent={ws.accent} />

        {/* Star button */}
        <button
          onMouseEnter={() => setStarHov(true)}
          onMouseLeave={() => setStarHov(false)}
          onClick={e => { e.stopPropagation(); onToggleStar(ws.id); }}
          style={{
            position: 'absolute', top: 10, right: 10,
            width: 28, height: 28, borderRadius: 6,
            border: `1px solid ${T.borderLight}`,
            background: starHov ? T.elevated : T.surface,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hov || ws.starred ? 1 : 0, transition: 'opacity 0.15s',
            color: T.dim,
          }}
        >
          <IconStar filled={ws.starred} />
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: ws.accent + '22', border: `1px solid ${ws.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: ws.accent, fontSize: 15, fontWeight: 800 }}>{ws.label}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: T.bright, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</p>
          <p style={{ color: T.dim, fontSize: 11, marginTop: 2 }}>Edited {ws.time}</p>
        </div>
        <div style={{ display: 'flex' }}>
          {ws.members.map((m, i) => (
            <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: T.elevated, border: `2px solid ${T.surface}`, marginLeft: i > 0 ? -7 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, color: T.text, fontWeight: 700 }}>{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
// TODO: Lucas — mover para src/components/layout/Navbar.tsx
function Navbar({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user } = useAuth();
  const initials = (user?.fullName ?? 'AL')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      height: 56, background: T.bg, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, zIndex: 30, position: 'relative',
    }}>
      {/* Left: logo + nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: T.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>fz</span>
          </div>
          <span style={{ color: T.bright, fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>fazelo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.elevated, color: T.bright, fontSize: 13, fontWeight: 500 }}>
          <IconGrid /><span>Dashboard</span>
        </div>
      </div>

      {/* Right: actions + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Theme toggle */}
        <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.elevated, cursor: 'pointer', color: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSun />
        </button>

        {/* Chat */}
        <button style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}>
          <IconMessage />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, background: T.bright, borderRadius: '50%', fontSize: 9, fontWeight: 700, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
        </button>

        {/* Notifications */}
        <button style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onMouseEnter={e => e.currentTarget.style.color = T.text}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}>
          <IconBell />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, background: T.bright, borderRadius: '50%', fontSize: 9, fontWeight: 700, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
        </button>

        <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

        {/* Avatar */}
        <button
          onClick={onOpenProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer', background: T.elevated }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.borderLight}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2A2A3A', border: `1px solid #3A3A4A`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ color: '#CCCCDD', fontSize: 10, fontWeight: 700 }}>{initials}</span>
            }
          </div>
          <span style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{user?.username ?? 'profile'}</span>
        </button>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(mockWorkspaces);
  const [search, setSearch] = useState('');

  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStar = (id: string) =>
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, starred: !w.starred } : w));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <Navbar onOpenProfile={() => setProfileOpen(true)} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ color: T.bright, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Workspaces</h1>
              <p style={{ color: T.dim, fontSize: 13 }}>{filtered.length} workspace{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.dim, display: 'flex' }}>
                  <IconSearch />
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search workspaces..."
                  style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 8, paddingBottom: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 13, outline: 'none', width: 220, boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = T.borderLight}
                  onBlur={e => e.target.style.borderColor = T.border}
                />
              </div>
              {/* New workspace button */}
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <IconPlus />New Workspace
              </button>
            </div>
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {filtered.map(ws => (
                <WorkspaceCard key={ws.id} ws={ws} onToggleStar={toggleStar} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              <p style={{ color: T.dim, fontSize: 14 }}>No workspaces match <strong style={{ color: T.text }}>"{search}"</strong></p>
              <button onClick={() => setSearch('')} style={{ marginTop: 10, background: 'none', border: 'none', color: T.dim, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
            </div>
          )}
        </div>

        <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      </div>
    </div>
  );
}