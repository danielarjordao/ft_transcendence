import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: 40, fontFamily: 'sans-serif' }}>
      <p style={{ color: '#ccc' }}>Dashboard placeholder</p>
      <p style={{ color: '#666', fontSize: 12, marginTop: 8 }}>Logado como: {user?.username}</p>
      <button
        onClick={logout}
        style={{ marginTop: 16, padding: '8px 16px', background: '#333', color: '#ccc', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        Logout
      </button>
    </div>
  );
}