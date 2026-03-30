import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ProfilePanel } from '../components/ProfilePanel';
import { useAuth } from '../contexts/AuthContext';
import ChatPanel from '../components/chat/ChatPanel';
import { useWorkspaceStore } from '../store/workspace.store';
import type { Workspace } from '../store/workspace.store';
import { totalUnread } from '../constants/chat';

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

const ACCENT_COLORS = [
  '#7B68EE', '#4A90D9', '#50C878', '#FFA500',
  '#FF6B6B', '#E87D7D', '#4ECDC4', '#9B8EC4',
];

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
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconPencil = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);

// ── Mini Kanban Preview ───────────────────────────────────────────────────────
function MiniKanban({ accent }: { accent: string }) {
  const cols = [
    { label: 'TO DO',        bars: [100, 60, 40] },
    { label: 'IN PROGRESS',  bars: [80, 50] },
    { label: 'DONE',         bars: [90] },
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

// ── New Workspace Modal ───────────────────────────────────────────────────────
function NewWorkspaceModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (ws: Workspace) => void;
}) {
  const [name, setName]     = useState('');
  const [accent, setAccent] = useState(ACCENT_COLORS[0]);
  const [error, setError]   = useState('');

  const handleCreate = () => {
    if (!name.trim()) { setError('Workspace name is required.'); return; }
    if (name.trim().length < 2) { setError('Name must be at least 2 characters.'); return; }
    onCreate({
      id: `ws${Date.now()}`,
      name: name.trim(),
      accent,
      label: name.trim()[0].toUpperCase(),
      time: 'Just now',
      members: ['A'],
      starred: false,
    });
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 420, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, zIndex: 101, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: T.bright, fontSize: 15, fontWeight: 700 }}>New Workspace</p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.dim, cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 6 }}>
            <IconX />
          </button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Name</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="e.g. ft_transcendence, Piscine..."
              autoFocus
              style={{ width: '100%', background: T.elevated, border: `1px solid ${error ? '#FF6B6B' : T.borderLight}`, borderRadius: 8, padding: '10px 12px', color: T.bright, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 6 }}>{error}</p>}
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#888', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map(c => (
                <button key={c} onClick={() => setAccent(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: accent === c ? `3px solid ${T.bright}` : '3px solid transparent', cursor: 'pointer', padding: 0 }} />
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '22', border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: accent, fontSize: 13, fontWeight: 800 }}>{name.trim() ? name.trim()[0].toUpperCase() : '?'}</span>
              </div>
              <span style={{ color: T.text, fontSize: 13 }}>{name.trim() || 'Workspace name'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleCreate} disabled={!name.trim()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: name.trim() ? T.primary : T.elevated, color: name.trim() ? '#fff' : T.dim, fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed' }}>
              Create Workspace
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Rename Modal ──────────────────────────────────────────────────────────────
function RenameModal({ ws, onClose, onRename }: {
  ws: Workspace;
  onClose: () => void;
  onRename: (id: string, name: string) => void;
}) {
  const [name, setName] = useState(ws.name);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (name.trim().length < 2) { setError('Minimum 2 characters.'); return; }
    onRename(ws.id, name.trim());
    onClose();
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 380, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, zIndex: 101, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ color: T.bright, fontSize: 15, fontWeight: 700 }}>Rename Workspace</p>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: T.dim, cursor: 'pointer', display: 'flex', padding: 4 }}><IconX /></button>
        </div>
        <div style={{ padding: '20px' }}>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
            style={{ width: '100%', background: T.elevated, border: `1px solid ${error ? '#FF6B6B' : T.borderLight}`, borderRadius: 8, padding: '10px 12px', color: T.bright, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: error ? 6 : 16 }}
          />
          {error && <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 16 }}>{error}</p>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: name.trim() ? T.primary : T.elevated, color: name.trim() ? '#fff' : T.dim, fontSize: 13, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed' }}>Save</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Workspace Card ────────────────────────────────────────────────────────────
function WorkspaceCard({ ws, onToggleStar, onRename, onDelete }: {
  ws: Workspace;
  onToggleStar: (id: string) => void;
  onRename: (ws: Workspace) => void;
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  const [hov, setHov]         = useState(false);
  const [starHov, setStarHov] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setMenuOpen(false); }}
      style={{ background: T.surface, border: `1px solid ${hov ? T.borderLight : T.border}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: hov ? '0 4px 24px rgba(0,0,0,0.25)' : 'none', position: 'relative' }}
    >
      {/* preview area */}
      <div
        onClick={() => navigate(`/board/${ws.id}`)}
        style={{ height: 160, background: T.bg, position: 'relative', borderBottom: `1px solid ${T.border}` }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: ws.accent, borderRadius: '12px 12px 0 0' }} />
        <MiniKanban accent={ws.accent} />

        {/* star */}
        <button
          onMouseEnter={() => setStarHov(true)}
          onMouseLeave={() => setStarHov(false)}
          onClick={e => { e.stopPropagation(); onToggleStar(ws.id); }}
          style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.borderLight}`, background: starHov ? T.elevated : T.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov || ws.starred ? 1 : 0, transition: 'opacity 0.15s', color: T.dim }}
        >
          <IconStar filled={ws.starred} />
        </button>
      </div>

      {/* footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          onClick={() => navigate(`/board/${ws.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
        >
          <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: ws.accent + '22', border: `1px solid ${ws.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: ws.accent, fontSize: 15, fontWeight: 800 }}>{ws.label}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: T.bright, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ws.name}</p>
            <p style={{ color: T.dim, fontSize: 11, marginTop: 2 }}>Edited {ws.time}</p>
          </div>
        </div>

        {/* members */}
        <div style={{ display: 'flex', marginRight: 4 }}>
          {ws.members.map((m, i) => (
            <div key={i} style={{ width: 22, height: 22, borderRadius: '50%', background: T.elevated, border: `2px solid ${T.surface}`, marginLeft: i > 0 ? -7 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 8, color: T.text, fontWeight: 700 }}>{m}</span>
            </div>
          ))}
        </div>

        {/* actions menu */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`, background: menuOpen ? T.elevated : 'transparent', color: T.dim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
            </svg>
          </button>

          {menuOpen && (
            <div
              onClick={e => e.stopPropagation()}
              style={{ position: 'absolute', right: 0, bottom: 36, width: 160, background: T.elevated, border: `1px solid ${T.borderLight}`, borderRadius: 8, overflow: 'hidden', zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
            >
              <button
                onClick={() => { setMenuOpen(false); onRename(ws); }}
                style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: T.text, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <IconPencil /> Rename
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete(ws.id); }}
                style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#FF6B6B', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#2A1010')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <IconTrash /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { workspaces, addWorkspace, removeWorkspace, renameWorkspace, toggleStar } = useWorkspaceStore();

  const [profileOpen, setProfileOpen]           = useState(false);
  const [chatOpen, setChatOpen]                 = useState(false);
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [renamingWs, setRenamingWs]             = useState<Workspace | null>(null);
  const [search, setSearch]                     = useState('');

  const filtered = workspaces.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden' }}>
      <Navbar onOpenProfile={() => setProfileOpen(true)} onOpenChat={() => setChatOpen(true)} chatUnreadCount={totalUnread} />

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
              <button
                onClick={() => setNewWorkspaceOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: T.primary, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <IconPlus />New Workspace
              </button>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
              {filtered.map(ws => (
                <WorkspaceCard
                  key={ws.id}
                  ws={ws}
                  onToggleStar={toggleStar}
                  onRename={setRenamingWs}
                  onDelete={removeWorkspace}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: 60 }}>
              {workspaces.length === 0 ? (
                <>
                  <p style={{ color: T.dim, fontSize: 14, marginBottom: 8 }}>No workspaces yet.</p>
                  <button
                    onClick={() => setNewWorkspaceOpen(true)}
                    style={{ background: 'none', border: 'none', color: T.primary, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Create your first workspace
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: T.dim, fontSize: 14 }}>No workspaces match <strong style={{ color: T.text }}>"{search}"</strong></p>
                  <button onClick={() => setSearch('')} style={{ marginTop: 10, background: 'none', border: 'none', color: T.dim, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
                </>
              )}
            </div>
          )}
        </div>

        <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
        <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} currentUserId={user?.id || '1'} />
      </div>

      {newWorkspaceOpen && (
        <NewWorkspaceModal
          onClose={() => setNewWorkspaceOpen(false)}
          onCreate={ws => { addWorkspace(ws); }}
        />
      )}

      {renamingWs && (
        <RenameModal
          ws={renamingWs}
          onClose={() => setRenamingWs(null)}
          onRename={renameWorkspace}
        />
      )}

      <div style={{ borderTop: '1px solid #2A2A2A', padding: '14px 24px', display: 'flex', gap: 20, flexShrink: 0 }}>
        <Link to="/privacy-policy" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>Privacy Policy</Link>
        <Link to="/terms-of-service" style={{ color: '#555', fontSize: 12, textDecoration: 'none' }}>Terms of Service</Link>
      </div>
    </div>
  );
}