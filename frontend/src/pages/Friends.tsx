import { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import { ProfilePanel } from '../components/ProfilePanel';
import ChatPanel from '../components/chat/ChatPanel';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
 
// ── tipos ─────────────────────────────────────────────────────────────────────
 
interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  online: boolean;
  addedAt: string;
}
 
interface FriendRequest {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  sentAt: string;
}
 
type Tab = 'friends' | 'pending' | 'sent';
 
// ── mock data ─────────────────────────────────────────────────────────────────
 
const MOCK_FRIENDS: Friend[] = [
  { id: 'u1', username: 'lucas_dev',  fullName: 'Lucas',   avatarUrl: null, online: true,  addedAt: 'Mar 10' },
  { id: 'u2', username: 'daniela_be', fullName: 'Daniela', avatarUrl: null, online: true,  addedAt: 'Mar 12' },
  { id: 'u3', username: 'murilo_db',  fullName: 'Murilo',  avatarUrl: null, online: false, addedAt: 'Mar 14' },
];
 
const MOCK_RECEIVED: FriendRequest[] = [
  { id: 'r1', username: 'joao_42',    fullName: 'João',    avatarUrl: null, sentAt: '2h ago'    },
  { id: 'r2', username: 'carla_dev',  fullName: 'Carla',   avatarUrl: null, sentAt: 'Yesterday' },
];
 
const MOCK_SENT: FriendRequest[] = [
  { id: 's1', username: 'pedro_ui',   fullName: 'Pedro',   avatarUrl: null, sentAt: '1d ago'    },
];
 
// ── avatar ────────────────────────────────────────────────────────────────────
 
function UserAvatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split('_').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#2A2A2A', border: '1px solid #3A3A3A',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span style={{ color: '#CCCCCC', fontSize: size * 0.32, fontWeight: 600 }}>{initials}</span>
    </div>
  );
}
 
// ── componente principal ──────────────────────────────────────────────────────
 
export default function Friends() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
 
  const [tab, setTab]                   = useState<Tab>('friends');
  const [friends, setFriends]           = useState<Friend[]>(MOCK_FRIENDS);
  const [received, setReceived]         = useState<FriendRequest[]>(MOCK_RECEIVED);
  const [sent, setSent]                 = useState<FriendRequest[]>(MOCK_SENT);
  const [search, setSearch]             = useState('');
  const [addInput, setAddInput]         = useState('');
  const [addError, setAddError]         = useState('');
  const [addSuccess, setAddSuccess]     = useState('');
  const [profileOpen, setProfileOpen]   = useState(false);
  const [chatOpen, setChatOpen]         = useState(false);
  const [_chatFriendId, setChatFriendId] = useState<string | null>(null);
 
  // ===== TRACK ONLINE USERS =====
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
 
  // ===== LISTENERS DE SOCKET.IO =====
  useEffect(() => {
    if (!isConnected) {
      console.log('⚠️ Friends: Socket not connected, online status unavailable');
      return;
    }
 
    console.log('🟢 Friends: Registering online/offline listeners');
 
    // Listener: user:online
    const handleUserOnline = (userId: string) => {
      console.log('✅ User online:', userId);
      setOnlineUserIds(prev => new Set(prev).add(userId));
    };
 
    // Listener: user:offline
    const handleUserOffline = (userId: string) => {
      console.log('❌ User offline:', userId);
      setOnlineUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };
 
    // Registrar listeners
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
 
    // Cleanup
    return () => {
      console.log('🔴 Friends: Removing online/offline listeners');
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
    };
  }, [isConnected, socket]);
 
  // ===== CALCULAR STATUS ONLINE (mock + socket) =====
  const getFriendOnlineStatus = (friendId: string): boolean => {
    // Se socket conectado, usar dados em tempo real
    if (isConnected && onlineUserIds.size > 0) {
      return onlineUserIds.has(friendId);
    }
    // Fallback: usar mock data
    const friend = friends.find(f => f.id === friendId);
    return friend?.online ?? false;
  };
 
  const onlineCount = friends.filter(f => getFriendOnlineStatus(f.id)).length;
  const pendingCount = received.length;
 
  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase()) ||
    f.fullName.toLowerCase().includes(search.toLowerCase())
  );
 
  // ── handlers ─────────────────────────────────────────────────────────────
 
  const handleAdd = () => {
    const username = addInput.trim().toLowerCase();
    if (!username) return;
    if (friends.some(f => f.username === username)) {
      setAddError('This user is already your friend.');
      setAddSuccess('');
      return;
    }
    if (sent.some(r => r.username === username)) {
      setAddError('You already sent a request to this user.');
      setAddSuccess('');
      return;
    }
    // TODO: POST /api/friends/request { username }
    setSent(prev => [...prev, {
      id: `s${Date.now()}`,
      username,
      fullName: username,
      avatarUrl: null,
      sentAt: 'Just now',
    }]);
    setAddInput('');
    setAddError('');
    setAddSuccess(`Friend request sent to @${username}.`);
    setTimeout(() => setAddSuccess(''), 3000);
  };
 
  const handleRemoveFriend = (id: string) => {
    // TODO: DELETE /api/friends/:id
    setFriends(prev => prev.filter(f => f.id !== id));
  };
 
  const handleAccept = (req: FriendRequest) => {
    // TODO: POST /api/friends/request/:id/accept
    setReceived(prev => prev.filter(r => r.id !== req.id));
    setFriends(prev => [...prev, {
      id: req.id,
      username: req.username,
      fullName: req.fullName,
      avatarUrl: req.avatarUrl,
      online: false,
      addedAt: 'Just now',
    }]);
  };
 
  const handleDecline = (id: string) => {
    // TODO: POST /api/friends/request/:id/decline
    setReceived(prev => prev.filter(r => r.id !== id));
  };
 
  const handleCancelRequest = (id: string) => {
    // TODO: DELETE /api/friends/request/:id
    setSent(prev => prev.filter(r => r.id !== id));
  };
 
  const handleOpenChat = (friendId: string) => {
    setChatFriendId(friendId);
    setChatOpen(true);
  };
 
  // ── estilos compartilhados ────────────────────────────────────────────────
 
  const cardStyle = {
    background: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: 10,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  } as const;
 
  const btnBase = {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid #3A3A3A',
    background: 'transparent',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } as const;
 
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#111111', overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <Navbar onOpenProfile={() => setProfileOpen(true)} />
 
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
 
        {/* header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: '#EEEEEE', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Friends</h1>
          <p style={{ color: '#666', fontSize: 13 }}>
            {friends.length} friends · {onlineCount} online
            {/* Status indicator */}
            {isConnected && (
              <span style={{ marginLeft: 8, fontSize: 11, color: '#50C878' }}>● Live</span>
            )}
          </p>
        </div>
 
        {/* add friend */}
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
          <p style={{ color: '#EEEEEE', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Add a friend</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={addInput}
              onChange={e => { setAddInput(e.target.value); setAddError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="Enter username..."
              style={{ flex: 1, background: '#222222', border: `1px solid ${addError ? '#FF6B6B' : '#3A3A3A'}`, borderRadius: 8, padding: '9px 12px', color: '#EEEEEE', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
            <button
              onClick={handleAdd}
              disabled={!addInput.trim()}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: addInput.trim() ? '#7B68EE' : '#2A2A2A', color: addInput.trim() ? '#FFFFFF' : '#555', fontSize: 13, fontWeight: 600, cursor: addInput.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
            >
              Send Request
            </button>
          </div>
          {addError   && <p style={{ color: '#FF6B6B', fontSize: 12, marginTop: 8 }}>{addError}</p>}
          {addSuccess && <p style={{ color: '#50C878', fontSize: 12, marginTop: 8 }}>{addSuccess}</p>}
        </div>
 
        {/* tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2A2A2A', marginBottom: 20 }}>
          {([
            { id: 'friends', label: `Friends (${friends.length})` },
            { id: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
            { id: 'sent',    label: `Sent (${sent.length})` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); }}
              style={{
                padding: '10px 16px', background: 'transparent', border: 'none',
                borderBottom: `2px solid ${tab === t.id ? '#7B68EE' : 'transparent'}`,
                color: tab === t.id ? '#F5F5F5' : '#666',
                fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
                cursor: 'pointer', transition: 'color 0.15s',
                position: 'relative',
              }}
            >
              {t.label}
              {t.id === 'pending' && pendingCount > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 4,
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#7B68EE',
                }} />
              )}
            </button>
          ))}
        </div>
 
        {/* ── aba friends ── */}
        {tab === 'friends' && (
          <>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search friends..."
              style={{ width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: '9px 14px', color: '#EEEEEE', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            {filteredFriends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
                <p style={{ fontSize: 14 }}>No friends found.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredFriends.map(friend => {
                  const isOnline = getFriendOnlineStatus(friend.id);
                  return (
                    <div key={friend.id} style={cardStyle}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <UserAvatar name={friend.username} size={40} />
                        {/* Badge dinâmico */}
                        <span style={{ 
                          position: 'absolute', bottom: 1, right: 1, 
                          width: 10, height: 10, borderRadius: '50%', 
                          background: isOnline ? '#50C878' : '#444', 
                          border: '2px solid #1A1A1A' 
                        }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600 }}>{friend.fullName}</p>
                        <p style={{ color: '#666', fontSize: 12 }}>@{friend.username} · added {friend.addedAt}</p>
                      </div>
                      {/* Status dinâmico */}
                      <span style={{ 
                        fontSize: 11, fontWeight: 600, 
                        color: isOnline ? '#50C878' : '#555', 
                        flexShrink: 0 
                      }}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => handleOpenChat(friend.id)}
                          style={{ ...btnBase, color: '#CCCCCC' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#FFF'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#3A3A3A'; e.currentTarget.style.color = '#CCCCCC'; }}
                        >
                          Message
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          style={{ ...btnBase, color: '#FF6B6B', borderColor: '#3A3A3A' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#2A1010'; e.currentTarget.style.borderColor = '#FF6B6B44'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#3A3A3A'; }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
 
        {/* ── aba pending ── */}
        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {received.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
                <p style={{ fontSize: 14 }}>No pending requests.</p>
              </div>
            ) : received.map(req => (
              <div key={req.id} style={cardStyle}>
                <UserAvatar name={req.username} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600 }}>{req.fullName}</p>
                  <p style={{ color: '#666', fontSize: 12 }}>@{req.username} · {req.sentAt}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleAccept(req)}
                    style={{ ...btnBase, background: '#7B68EE', border: 'none', color: '#fff', fontWeight: 600 }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#6A58DE')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#7B68EE')}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(req.id)}
                    style={{ ...btnBase, color: '#888' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#FF6B6B'; e.currentTarget.style.borderColor = '#FF6B6B44'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#3A3A3A'; }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
 
        {/* ── aba sent ── */}
        {tab === 'sent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sent.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#444' }}>
                <p style={{ fontSize: 14 }}>No sent requests.</p>
              </div>
            ) : sent.map(req => (
              <div key={req.id} style={cardStyle}>
                <UserAvatar name={req.username} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#EEEEEE', fontSize: 14, fontWeight: 600 }}>{req.fullName}</p>
                  <p style={{ color: '#666', fontSize: 12 }}>@{req.username} · sent {req.sentAt}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#555', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pending
                </span>
                <button
                  onClick={() => handleCancelRequest(req.id)}
                  style={{ ...btnBase, color: '#888', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#FF6B6B'; e.currentTarget.style.borderColor = '#FF6B6B44'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#3A3A3A'; }}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
 
      </div>
 
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatFriendId(null); }}
        currentUserId={user?.id ?? '1'}
      />
    </div>
  );
}