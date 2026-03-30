import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onOpenProfile?: () => void;
  onOpenChat?: () => void;
  chatUnreadCount?: number;
}

const T = {
  bg:          '#111111',
  elevated:    '#222222',
  border:      '#2A2A2A',
  borderLight: '#3A3A3A',
  text:        '#CCCCCC',
  bright:      '#EEEEEE',
  dim:         '#555555',
  primary:     '#7B68EE',
  surface:     '#1A1A1A',
};

const INITIAL_NOTIFICATIONS = [
  { id: 'n1', type: 'task',    title: 'Task moved to Done',       body: 'JWT authentication was marked as done by daniela_be', time: '2m ago',    read: false },
  { id: 'n2', type: 'comment', title: 'New comment on your task', body: 'murilo_db commented on "Setup NestJS project"',        time: '18m ago',   read: false },
  { id: 'n3', type: 'mention', title: 'You were mentioned',       body: 'lucas_dev mentioned you in "Kanban board component"',  time: '1h ago',    read: false },
  { id: 'n4', type: 'task',    title: 'Task assigned to you',     body: '"Profile page UI" was assigned to you',                time: '3h ago',    read: true  },
  { id: 'n5', type: 'member',  title: 'New workspace member',     body: 'daniela_be joined ft_transcendence',                   time: 'Yesterday', read: true  },
];

const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
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
const IconMessage = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

function NotifIcon({ type }: { type: string }) {
  const configs: Record<string, { bg: string; icon: ReactElement }> = {
    task:    { bg: '#2A3A6A', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7B68EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    comment: { bg: '#2A3A2A', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#50C878" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    mention: { bg: '#3A2A2A', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg> },
    member:  { bg: '#2A2A3A', icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  };
  const c = configs[type] ?? configs.task;
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {c.icon}
    </div>
  );
}

function NotificationDropdown({ notifications, onMarkAllRead, onMarkOneRead, onClose }: {
  notifications: typeof INITIAL_NOTIFICATIONS;
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | 'task' | 'comment' | 'mention' | 'member'>('all');

  const hasUnread = notifications.some(n => !n.read);
  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadInFilter = filtered.filter(n => !n.read).length;

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const id = setTimeout(() => document.addEventListener('mousedown', handle), 0);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handle); };
  }, [onClose]);

  const filterTabs: { id: typeof filter; label: string }[] = [
    { id: 'all',     label: 'All'      },
    { id: 'task',    label: 'Tasks'    },
    { id: 'comment', label: 'Comments' },
    { id: 'mention', label: 'Mentions' },
    { id: 'member',  label: 'Members'  },
  ];

  return (
    <div ref={ref} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 380, background: T.surface, border: `1px solid ${T.borderLight}`, borderRadius: 10, zIndex: 200, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <div style={{ padding: '12px 16px', background: T.elevated, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: T.bright, fontSize: 14, fontWeight: 600 }}>Notifications</span>
        <button onClick={onMarkAllRead} disabled={!hasUnread} style={{ color: hasUnread ? T.primary : T.dim, fontSize: 12, border: 'none', background: 'transparent', cursor: hasUnread ? 'pointer' : 'default', fontFamily: 'inherit' }}>
          Mark all as read
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.elevated, overflowX: 'auto' }}>
        {filterTabs.map(t => (
          <button key={t.id} onClick={() => setFilter(t.id)} style={{ padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: `2px solid ${filter === t.id ? T.primary : 'transparent'}`, color: filter === t.id ? T.bright : T.dim, fontSize: 12, fontWeight: filter === t.id ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'color 0.1s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.elevated, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <IconBell />
            </div>
            <p style={{ color: T.dim, fontSize: 13 }}>
              {filter === 'all' ? 'No notifications yet.' : `No ${filter} notifications.`}
            </p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <div key={n.id} onClick={() => onMarkOneRead(n.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: n.read ? T.surface : T.elevated, borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : 'none', borderLeft: n.read ? '3px solid transparent' : `3px solid ${T.primary}`, cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
              onMouseLeave={e => (e.currentTarget.style.background = n.read ? T.surface : T.elevated)}
            >
              <NotifIcon type={n.type} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: T.bright, fontSize: 13, fontWeight: n.read ? 400 : 600, marginBottom: 2 }}>{n.title}</p>
                <p style={{ color: T.text, fontSize: 12, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>
                <p style={{ color: T.dim, fontSize: 11, marginTop: 4 }}>{n.time}</p>
              </div>
              {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: T.primary, flexShrink: 0, marginTop: 4 }} />}
            </div>
          ))
        )}
      </div>

      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <span style={{ color: T.dim, fontSize: 12 }}>
          {unreadInFilter > 0 ? `${unreadInFilter} unread` : 'All caught up'}
        </span>
      </div>
    </div>
  );
}

export default function Navbar({ onOpenProfile, onOpenChat, chatUnreadCount = 0 }: NavbarProps) {
  const navigate  = useNavigate();
const location  = useLocation();
const isFriends = location.pathname === '/friends';
  const { user } = useAuth();

  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const initials = (user?.fullName ?? 'AL')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markOneRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div style={{ height: 56, background: T.bg, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0, zIndex: 30, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <div style={{ width: 32, height: 32, background: T.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>fz</span>
          </div>
          <span style={{ color: T.bright, fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>fazelo</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.elevated, color: T.bright, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <IconGrid /><span>Dashboard</span>
          </div>
          <div
  onClick={() => navigate('/friends')}
  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: `1px solid ${isFriends ? T.border : 'transparent'}`, background: isFriends ? T.elevated : 'transparent', color: isFriends ? T.bright : T.dim, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
  onMouseEnter={e => { if (!isFriends) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.bright; } }}
  onMouseLeave={e => { if (!isFriends) { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = T.dim; } }}
>
  <span>Friends</span>
</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.elevated, cursor: 'pointer', color: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSun />
        </button>

        {/* chat */}
        <button onClick={onOpenChat}
          style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <IconMessage />
          {chatUnreadCount > 0 && (
            <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, background: T.bright, borderRadius: 8, fontSize: 9, fontWeight: 700, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
              {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
            </span>
          )}
        </button>

        {/* notifications */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(o => !o)}
            style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: notifOpen ? T.elevated : 'transparent', cursor: 'pointer', color: notifOpen ? T.bright : T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.color = T.dim; }}
          >
            <IconBell />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, background: T.primary, borderRadius: 8, fontSize: 9, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <NotificationDropdown notifications={notifications} onMarkAllRead={markAllRead} onMarkOneRead={markOneRead} onClose={() => setNotifOpen(false)} />
          )}
        </div>

        <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

        {/* profile */}
        <button onClick={onOpenProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 5px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer', background: T.elevated, fontFamily: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.borderLight)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
        >
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2A2A3A', border: '1px solid #3A3A4A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
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