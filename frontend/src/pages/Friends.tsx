import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { ProfilePanel } from '../components/ProfilePanel';

// ── tipos ─────────────────────────────────────────────────────────────────────

interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  online: boolean;
  addedAt: string;
}

// ── mock data ─────────────────────────────────────────────────────────────────

const MOCK_FRIENDS: Friend[] = [
  { id: 'u1', username: 'lucas_dev',  fullName: 'Lucas',   avatarUrl: null, online: true,  addedAt: 'Mar 10' },
  { id: 'u2', username: 'daniela_be', fullName: 'Daniela', avatarUrl: null, online: true,  addedAt: 'Mar 12' },
  { id: 'u3', username: 'murilo_db',  fullName: 'Murilo',  avatarUrl: null, online: false, addedAt: 'Mar 14' },
];

// ── avatar com iniciais ───────────────────────────────────────────────────────

function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split('_').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#2A2A2A',
      border: '1px solid #3A3A3A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: '#CCCCCC', fontSize: size * 0.32, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}

// ── componente principal ──────────────────────────────────────────────────────

export default function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends]         = useState<Friend[]>(MOCK_FRIENDS);
  const [search, setSearch]           = useState('');
  const [addInput, setAddInput]       = useState('');
  const [addError, setAddError]       = useState('');
  const [addSuccess, setAddSuccess]   = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    f.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    const username = addInput.trim().toLowerCase();
    if (!username) return;

    if (friends.some(f => f.username === username)) {
      setAddError('This user is already your friend.');
      setAddSuccess('');
      return;
    }

    // mock: simula adição bem-sucedida
    // TODO: substituir por POST /api/friends { username }
    const newFriend: Friend = {
      id: `u${Date.now()}`,
      username,
      fullName: username,
      avatarUrl: null,
      online: false,
      addedAt: 'Just now',
    };
    setFriends(prev => [...prev, newFriend]);
    setAddInput('');
    setAddError('');
    setAddSuccess(`@${username} added as a friend.`);
    setTimeout(() => setAddSuccess(''), 3000);
  };

  const handleRemove = (id: string) => {
    setFriends(prev => prev.filter(f => f.id !== id));
  };

  const onlineCount = friends.filter(f => f.online).length;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#111111',
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Navbar onOpenProfile={() => setProfileOpen(true)} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', maxWidth: 680, width: '100%', margin: '0 auto' }}>

        {/* header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#EEEEEE', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Friends</h1>
          <p style={{ color: '#666', fontSize: 13 }}>
            {friends.length} friends · {onlineCount} online
          </p>
        </div>

        {/* add friend */}
        <div style={{
          background: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: 12,
          padding: '18px 20px',
          marginBottom: 24,
        }}>
          <p style={{ color: '#EEEEEE', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add a friend</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={addInput}
              onChange={e => { setAddInput(e.target.value); setAddError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Enter username..."
              style={{
                flex: 1,
                background: '#222222',
                border: `1px solid ${addError ? '#FF6B6B' : '#3A3A3A'}`,
                borderRadius: 8,
                padding: '9px 12px',
                color: '#EEEEEE',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!addInput.trim()}
              style={{
                padding: '9px 18px',
                borderRadius: 8,
                border: 'none',
                background: addInput.trim() ? '#7B68EE' : '#2A2A2A',
                color: addInput.trim() ? '#FFFFFF' : '#555',
                fontSize: 13,
                fontWeight: 600,
                cursor: addInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              Add
            </button>
          </div>
          {addError && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8 }}>{addError}</p>}
          {addSuccess && <p style={{ color: '#50C878', fontSize: 12, marginTop: 8 }}>{addSuccess}</p>}
        </div>

        {/* search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search friends..."
          style={{
            width: '100%',
            background: '#1A1A1A',
            border: '1px solid #2A2A2A',
            borderRadius: 8,
            padding: '9px 14px',
            color: '#EEEEEE',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 16,
          }}
        />

        {/* lista */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
            <p style={{ fontSize: 14 }}>No friends found.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(friend => (
              <div
                key={friend.id}
                style={{
                  background: '#1A1A1A',
                  border: '1px solid #2A2A2A',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                {/* avatar + status */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <UserAvatar name={friend.username} size={40} />
                  <span style={{
                    position: 'absolute',
                    bottom: 1,
                    right: 1,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: friend.online ? '#50C878' : '#444',
                    border: '2px solid #1A1A1A',
                  }} />
                </div>

                {/* info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600 }}>{friend.fullName}</p>
                  <p style={{ color: '#666', fontSize: 12 }}>@{friend.username} · added {friend.addedAt}</p>
                </div>

                {/* status badge */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: friend.online ? '#50C878' : '#555',
                  flexShrink: 0,
                }}>
                  {friend.online ? 'Online' : 'Offline'}
                </span>

                {/* ações */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => navigate('/dashboard')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #3A3A3A',
                      background: 'transparent',
                      color: '#CCCCCC',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Message
                  </button>
                  <button
                    onClick={() => handleRemove(friend.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: '1px solid #3A3A3A',
                      background: 'transparent',
                      color: '#FF6B6B',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}