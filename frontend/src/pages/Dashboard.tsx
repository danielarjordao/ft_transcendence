import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';
import { ProfilePanel } from '../components/ProfilePanel';
import { useAuth } from '../contexts/AuthContext';
import ChatPanel from '../components/chat/ChatPanel';

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
      <div style={{ height: 160, background: T.bg, position: 'relative', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ws.accent, borderRadius: '12px 12px 0 0' }} />
        <MiniKanban accent={ws.accent} />
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

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(mockWorkspaces);
  const [search, setSearch] = useState('');

  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStar = (id: string) =>
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, starred: !w.starred } : w));

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <Navbar onOpenProfile={() => setProfileOpen(true)} onOpenChat={() => setChatOpen(true)} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ color: T.bright, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Workspaces</h1>
              <p style={{ color: T.dim, fontSize: 13 }}>{filtered.length} workspace{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <IconPlus />New Workspace
              </button>
            </div>
          </div>

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

        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          currentUserId={user?.id || '1'}
        />
      </div>
    </div>
  );
}