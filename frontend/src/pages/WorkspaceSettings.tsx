import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ProfilePanel } from '../components/ProfilePanel';
import { useWorkspaceStore } from '../store/workspace.store';

const ACCENT_COLORS = [
  '#7B68EE', '#4A90D9', '#50C878', '#FFA500',
  '#FF6B6B', '#E87D7D', '#4ECDC4', '#9B8EC4',
];

interface Member {
  id: string;
  username: string;
  email: string;
  role: 'Admin' | 'Moderator' | 'Member';
  isCreator: boolean;
}

const MOCK_MEMBERS: Member[] = [
  { id: 'm1', username: 'ana_laura',  email: 'ana@42.fr',     role: 'Admin',  isCreator: true  },
  { id: 'm2', username: 'lucas_dev',  email: 'lucas@42.fr',   role: 'Member', isCreator: false },
  { id: 'm3', username: 'daniela_be', email: 'daniela@42.fr', role: 'Member', isCreator: false },
  { id: 'm4', username: 'murilo_db',  email: 'murilo@42.fr',  role: 'Member', isCreator: false },
];

// ── confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380, background: '#1A1A1A',
        border: '1px solid #3A3A3A', borderRadius: 12,
        padding: 24, zIndex: 101,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <h3 style={{ color: '#EEEEEE', fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{title}</h3>
        <p style={{ color: '#888', fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>{body}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #3A3A3A', background: 'transparent', color: '#CCC', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: danger ? '#FF6B6B' : '#7B68EE', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function WorkspaceSettings() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspaces, renameWorkspace, removeWorkspace } = useWorkspaceStore();

  const workspace = workspaces.find(w => w.id === workspaceId);

  const [profileOpen, setProfileOpen]     = useState(false);
  const [name, setName]                   = useState(workspace?.name ?? '');
  const [accent, setAccent]               = useState(workspace?.accent ?? ACCENT_COLORS[0]);
  const [nameError, setNameError]         = useState('');
  const [nameSaved, setNameSaved]         = useState(false);
  const [members, setMembers]             = useState<Member[]>(MOCK_MEMBERS);
  const [addInput, setAddInput]           = useState('');
  const [addError, setAddError]           = useState('');
  const [addSuccess, setAddSuccess]       = useState('');
  const [confirm, setConfirm]             = useState<{
    type: 'remove_member' | 'delete_workspace';
    memberId?: string;
    memberName?: string;
  } | null>(null);

  if (!workspace) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>Workspace not found.</p>
          <Link to="/dashboard" style={{ color: '#7B68EE', fontSize: 13 }}>Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const handleSaveName = () => {
    if (!name.trim()) { setNameError('Name is required.'); return; }
    if (name.trim().length < 2) { setNameError('Minimum 2 characters.'); return; }
    renameWorkspace(workspaceId!, name.trim());
    setNameError('');
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleSaveColor = (color: string) => {
    setAccent(color);
    // TODO: conectar a PATCH /api/workspaces/:id quando backend estiver pronto
  };

  const handleAddMember = () => {
    const username = addInput.trim().toLowerCase();
    if (!username) return;
    if (members.some(m => m.username === username)) {
      setAddError('This user is already a member.');
      setAddSuccess('');
      return;
    }
    setMembers(prev => [...prev, {
      id: `m${Date.now()}`,
      username,
      email: `${username}@42.fr`,
      role: 'Member',
      isCreator: false,
    }]);
    setAddInput('');
    setAddError('');
    setAddSuccess(`@${username} added to workspace.`);
    setTimeout(() => setAddSuccess(''), 3000);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setConfirm(null);
  };

  const handleDeleteWorkspace = () => {
    removeWorkspace(workspaceId!);
    navigate('/dashboard');
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#888',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    display: 'block', marginBottom: 8,
  };

  const sectionStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  };

  return (
    <>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#111111', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <Navbar onOpenProfile={() => setProfileOpen(true)} />

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 720, width: '100%', margin: '0 auto' }}>

          {/* breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <Link to={`/board/${workspaceId}`} style={{ color: '#555', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#888')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555')}>
              {workspace.name}
            </Link>
            <span style={{ color: '#333' }}>›</span>
            <span style={{ color: '#888' }}>Settings</span>
          </div>

          <h1 style={{ color: '#EEEEEE', fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Workspace Settings</h1>

          {/* ── General ── */}
          <div style={sectionStyle}>
            <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>General</p>

            {/* name */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Workspace name</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={name}
                  onChange={e => { setName(e.target.value); setNameError(''); setNameSaved(false); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
                  style={{ flex: 1, background: '#222222', border: `1px solid ${nameError ? '#FF6B6B' : '#3A3A3A'}`, borderRadius: 8, padding: '9px 12px', color: '#EEEEEE', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  onClick={handleSaveName}
                  style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#7B68EE', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
                >
                  Save
                </button>
              </div>
              {nameError && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 6 }}>{nameError}</p>}
              {nameSaved && <p style={{ color: '#50C878', fontSize: 12, marginTop: 6 }}>Name updated.</p>}
            </div>

            {/* color */}
            <div>
              <label style={labelStyle}>Accent color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => handleSaveColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: accent === c ? '3px solid #EEEEEE' : '3px solid transparent', cursor: 'pointer', padding: 0, transition: 'border 0.1s' }}
                  />
                ))}
              </div>
              {/* preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '22', border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: accent, fontSize: 13, fontWeight: 800 }}>{name.trim() ? name.trim()[0].toUpperCase() : '?'}</span>
                </div>
                <span style={{ color: '#888', fontSize: 12 }}>Preview of workspace card accent</span>
              </div>
            </div>
          </div>

          {/* ── Members ── */}
          <div style={sectionStyle}>
            <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
              Members <span style={{ color: '#555', fontWeight: 400, fontSize: 13 }}>({members.length})</span>
            </p>

            {/* add member */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Add member</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={addInput}
                  onChange={e => { setAddInput(e.target.value); setAddError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddMember(); }}
                  placeholder="Enter username..."
                  style={{ flex: 1, background: '#222222', border: `1px solid ${addError ? '#FF6B6B' : '#3A3A3A'}`, borderRadius: 8, padding: '9px 12px', color: '#EEEEEE', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
                />
                <button
                  onClick={handleAddMember}
                  disabled={!addInput.trim()}
                  style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: addInput.trim() ? '#7B68EE' : '#2A2A2A', color: addInput.trim() ? '#fff' : '#555', fontSize: 13, fontWeight: 600, cursor: addInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, fontFamily: 'inherit' }}
                >
                  Add
                </button>
              </div>
              {addError   && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 6 }}>{addError}</p>}
              {addSuccess && <p style={{ color: '#50C878', fontSize: 12, marginTop: 6 }}>{addSuccess}</p>}
            </div>

            {/* member list */}
            <div style={{ border: '1px solid #2A2A2A', borderRadius: 8, overflow: 'hidden' }}>
              {members.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < members.length - 1 ? '1px solid #222' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2A2A2A', border: '1px solid #3A3A3A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#CCC', fontSize: 12, fontWeight: 700 }}>
                      {m.username.split('_').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#EEEEEE', fontSize: 13, fontWeight: 500 }}>@{m.username}</p>
                    <p style={{ color: '#555', fontSize: 11 }}>{m.email}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: m.role === 'Admin' ? '#7B68EE' : m.role === 'Moderator' ? '#4A90D9' : '#555',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    flexShrink: 0,
                  }}>
                    {m.role}{m.isCreator && ' 🔒'}
                  </span>
                  {!m.isCreator && (
                    <button
                      onClick={() => setConfirm({ type: 'remove_member', memberId: m.id, memberName: m.username })}
                      style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #2A2A2A', background: 'transparent', color: '#555', fontSize: 12, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B6B44'; e.currentTarget.style.color = '#FF6B6B'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#555'; }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Danger zone ── */}
          <div style={{ ...sectionStyle, borderColor: '#FF6B6B22' }}>
            <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Danger Zone</p>
            <p style={{ color: '#555', fontSize: 13, marginBottom: 16 }}>Deleting a workspace is permanent and cannot be undone. All tasks and subjects will be lost.</p>
            <button
              onClick={() => setConfirm({ type: 'delete_workspace' })}
              style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #FF6B6B44', background: 'transparent', color: '#FF6B6B', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2A1010'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              Delete workspace
            </button>
          </div>

        </div>
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />

      {confirm?.type === 'remove_member' && (
        <ConfirmModal
          title={`Remove @${confirm.memberName}?`}
          body="This user will lose access to the workspace and all its tasks."
          confirmLabel="Remove"
          danger
          onConfirm={() => handleRemoveMember(confirm.memberId!)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {confirm?.type === 'delete_workspace' && (
        <ConfirmModal
          title="Delete workspace?"
          body={`"${workspace.name}" will be permanently deleted along with all its tasks, subjects and fields. This cannot be undone.`}
          confirmLabel="Delete workspace"
          danger
          onConfirm={handleDeleteWorkspace}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}