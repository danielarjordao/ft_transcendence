import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavbarProps {
  onOpenProfile?: () => void;
  onOpenChat?: () => void;
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
};

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

export default function Navbar({ onOpenProfile, onOpenChat }: NavbarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initials = (user?.fullName ?? 'AL')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      height: 56, background: T.bg, borderBottom: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0, zIndex: 30, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          <div style={{ width: 32, height: 32, background: T.primary, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>fz</span>
          </div>
          <span style={{ color: T.bright, fontSize: 16, fontWeight: 800, letterSpacing: '-0.3px' }}>fazelo</span>
        </div>
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.elevated, color: T.bright, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        >
          <IconGrid /><span>Dashboard</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={{ width: 36, height: 36, borderRadius: 8, border: `1px solid ${T.border}`, background: T.elevated, cursor: 'pointer', color: '#FFA500', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSun />
        </button>

        <button
          onClick={onOpenChat}
          style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <IconMessage />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, background: T.bright, borderRadius: '50%', fontSize: 9, fontWeight: 700, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</span>
        </button>

        <button
          style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text)}
          onMouseLeave={e => (e.currentTarget.style.color = T.dim)}
        >
          <IconBell />
          <span style={{ position: 'absolute', top: 5, right: 5, width: 16, height: 16, background: T.bright, borderRadius: '50%', fontSize: 9, fontWeight: 700, color: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
        </button>

        <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />

        <button
          onClick={onOpenProfile}
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