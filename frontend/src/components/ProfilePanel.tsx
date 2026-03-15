
import { useState, useEffect } from 'react';
import type { User } from '../types/auth';
import { AvatarUpload } from './AvatarUpload';
import { useAuth } from '../contexts/AuthContext';

// ── Theme — espelha exatamente o protótipo aprovado ──────────────────────────
const T = {
  bg: '#111111',
  surface: '#1A1A1A',
  elevated: '#222222',
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  text: '#CCCCCC',
  dim: '#666666',
  bright: '#EEEEEE',
  danger: '#FF6B6B',
  primary: '#FFFFFF',
  primaryText: '#111111',
  inputBg: '#222222',
  devBg: '#1A1E1A',
  devBorder: '#2A3A2A',
  devText: '#6A966A',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}
interface ProfileForm {
  fullName: string;
  username: string;
  bio: string;
}
interface FormErrors {
  fullName?: string;
  username?: string;
  bio?: string;
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  standard: 'Standard',
  oauth_42: '42 OAuth',
  oauth_google: 'Google OAuth',
  oauth_github: 'GitHub OAuth',
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconLock = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconSignOut = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconUser = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconAlert = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ── Avatar display (view mode) ─────────────────────────────────────────────────
function AvatarDisplay({ user, size = 72 }: { user: User; size?: number }) {
  const initials = user.fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: '#2A2A3A', border: '2px solid #3A3A4A',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
    }}>
      {user.avatarUrl
        ? <img src={user.avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <span style={{ fontSize: size * 0.28, fontWeight: 700, color: '#CCCCDD' }}>{initials}</span>
      }
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p style={{ color: T.dim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 24, marginBottom: 4 }}>
      {children}
    </p>
  );
}

// ── Field row (view mode) ─────────────────────────────────────────────────────
function FieldRow({ label, value, locked }: { label: string; value?: string | null; locked?: boolean }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
      <p style={{ color: T.dim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <p style={{ color: value ? T.bright : T.dim, fontSize: 14, lineHeight: 1.5, fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'Not set'}
        </p>
        {locked && <span style={{ color: T.dim, display: 'flex' }}><IconLock /></span>}
      </div>
    </div>
  );
}

// ── Input (edit mode) ─────────────────────────────────────────────────────────
function Field({
  label, value, onChange, error, readOnly, maxLength, multiline, hint,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  error?: string; readOnly?: boolean; maxLength?: number; multiline?: boolean; hint?: string;
}) {
  const count = value?.length || 0;
  const over = maxLength ? count > maxLength : false;
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ color: T.dim, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>
        {maxLength && <span style={{ fontSize: 10, color: over ? T.danger : T.dim }}>{count}/{maxLength}</span>}
      </div>
      <Tag
        value={value}
        rows={multiline ? 3 : undefined}
        onChange={e => onChange?.((e.target as HTMLInputElement | HTMLTextAreaElement).value)}
        readOnly={readOnly}
        style={{
          width: '100%', background: readOnly ? T.bg : T.inputBg,
          border: `1px solid ${error ? T.danger : T.borderLight}`,
          borderRadius: 7, padding: '9px 11px',
          color: readOnly ? T.dim : T.bright,
          fontSize: 13, outline: 'none',
          resize: multiline ? 'vertical' : 'none',
          boxSizing: 'border-box', fontFamily: 'inherit',
          cursor: readOnly ? 'not-allowed' : 'text',
        }}
      />
      {hint && !error && <p style={{ color: T.dim, fontSize: 11, marginTop: 4 }}>{hint}</p>}
      {error && (
        <p style={{ color: T.danger, fontSize: 11, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IconAlert />{error}
        </p>
      )}
    </div>
  );
}

// ── Profile View ──────────────────────────────────────────────────────────────
function ProfileView({ user, onEdit }: { user: User; onEdit: () => void }) {
  const joined = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
        <AvatarDisplay user={user} size={72} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: T.bright, fontSize: 18, fontWeight: 700 }}>{user.fullName}</p>
          <p style={{ color: T.dim, fontSize: 13, marginTop: 3 }}>{user.email}</p>
        </div>
        <button
          onClick={onEdit}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 7, border: `1px solid ${T.borderLight}`, background: 'transparent', color: T.text, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = T.bright; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.text; }}
        >
          <IconEdit />Edit
        </button>
      </div>

      <SectionLabel>About</SectionLabel>
      <FieldRow label="Username" value={`@${user.username}`} />
      <FieldRow label="Email" value={user.email} locked />
      <FieldRow label="Bio" value={user.bio} />

      <SectionLabel>Account</SectionLabel>
      <FieldRow label="Member Since" value={joined} />
      <FieldRow label="Account Type" value={ACCOUNT_TYPE_LABEL[user.accountType] ?? user.accountType} />
    </div>
  );
}

// ── Profile Edit ──────────────────────────────────────────────────────────────
function ProfileEdit({ user, onCancel, onSave }: {
  user: User;
  onCancel: () => void;
  onSave: (data: ProfileForm) => Promise<void>;
}) {
  const [form, setForm] = useState<ProfileForm>({
    fullName: user.fullName,
    username: user.username,
    bio: user.bio ?? '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isDirty = form.fullName !== user.fullName || form.username !== user.username || form.bio !== (user.bio ?? '') || avatarFile !== null;

  const set = (key: keyof ProfileForm) => (val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setSaveError(null);
  };

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    else if (form.fullName.trim().length < 2) e.fullName = 'Minimum 2 characters.';
    if (!form.username.trim()) e.username = 'Username is required.';
    else if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) e.username = '3–30 characters. Letters, numbers and _ only.';
    if (form.bio.length > 280) e.bio = 'Maximum 280 characters.';
    return e;
  }

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await onSave(form);
    } catch (err: unknown) {
      if ((err as { type?: string }).type === 'username_taken')
        setErrors(p => ({ ...p, username: 'This username is already taken.' }));
      else setSaveError('Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 20, borderBottom: `1px solid ${T.border}`, marginBottom: 20 }}>
        <AvatarUpload
          username={form.username}
          currentAvatar={user.avatarUrl}
          onFileSelect={file => setAvatarFile(file)}
          onRemove={() => setAvatarFile(null)}
          size="md"
        />
      </div>

      {saveError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#2A1010', border: `1px solid #FF4D4D40`, borderRadius: 7, padding: '9px 12px', marginBottom: 16, color: T.danger, fontSize: 12 }}>
          <IconAlert />{saveError}
        </div>
      )}

      <Field label="Full Name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} maxLength={80} />
      <Field label="Username" value={form.username} onChange={set('username')} error={errors.username} maxLength={30} />
      <Field label="Email" value={user.email} readOnly hint="Email cannot be changed here." />
      <Field label="Bio" value={form.bio} onChange={set('bio')} error={errors.bio} maxLength={280} multiline />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button
          onClick={onCancel}
          style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${T.borderLight}`, background: 'transparent', color: T.text, fontSize: 13, cursor: 'pointer' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7, border: 'none', background: isDirty && !saving ? T.primary : T.border, color: isDirty && !saving ? T.primaryText : T.dim, fontSize: 13, fontWeight: 600, cursor: isDirty && !saving ? 'pointer' : 'not-allowed' }}
        >
          {saving ? 'Saving…' : <><IconCheck />Save Changes</>}
        </button>
      </div>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  return (
    <div>
      <SectionLabel>Password</SectionLabel>
      <p style={{ color: T.dim, fontSize: 12, marginTop: 8, marginBottom: 16, lineHeight: 1.6 }}>
        Password change will be available after backend integration.
      </p>
      <button disabled style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.dim, fontSize: 13, cursor: 'not-allowed', opacity: 0.5 }}>
        Update Password
      </button>
      <div style={{ borderTop: `1px solid ${T.border}`, marginTop: 24, paddingTop: 20 }}>
        <p style={{ color: T.dim, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Two-Factor Authentication</p>
        <p style={{ color: T.dim, fontSize: 12, lineHeight: 1.6, marginBottom: 16 }}>
          Add an extra layer of security by enabling 2FA via an authenticator app.
        </p>
        <button disabled style={{ padding: '8px 16px', borderRadius: 7, border: `1px solid ${T.border}`, background: 'transparent', color: T.dim, fontSize: 13, cursor: 'not-allowed', opacity: 0.5 }}>
          Enable 2FA
        </button>
      </div>
    </div>
  );
}

// ── Profile Panel ─────────────────────────────────────────────────────────────
export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, logout } = useAuth();
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [tab, setTab] = useState<'profile' | 'security'>('profile');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleClose = () => { setMode('view'); onClose(); };

  if (!user) return null;

  const tabs = [
    { id: 'profile' as const, label: 'Profile', Icon: IconUser },
    { id: 'security' as const, label: 'Security', Icon: IconShield },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40,
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 480,
        background: T.surface, borderLeft: `1px solid ${T.borderLight}`,
        zIndex: 50, display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: open ? '-16px 0 48px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <p style={{ color: T.bright, fontSize: 15, fontWeight: 700 }}>Account Settings</p>
          <button
            onClick={handleClose}
            style={{ width: 30, height: 30, borderRadius: 6, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.dim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderLight; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.dim; }}
          >
            <IconX />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMode('view'); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '13px 0', border: 'none', cursor: 'pointer', background: 'transparent',
                color: tab === id ? T.bright : T.dim,
                fontSize: 13, fontWeight: tab === id ? 600 : 400,
                borderBottom: tab === id ? `2px solid ${T.bright}` : '2px solid transparent',
              }}
            >
              <Icon />{label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 0' }}>
          {tab === 'profile'
            ? mode === 'view'
              ? <ProfileView user={user} onEdit={() => setMode('edit')} />
              : <ProfileEdit
                  user={user}
                  onCancel={() => setMode('view')}
                  onSave={async data => {
                    // TODO: await api.patch('/users/me', data);
                    console.log('PATCH /api/users/me', data);
                    setMode('view');
                  }}
                />
            : <SecurityTab />
          }
        </div>

        {/* Sign out */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '11px 0', borderRadius: 8, border: `1px solid ${T.borderLight}`, background: 'transparent', color: T.danger, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#2A1010'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <IconSignOut />Sign out
          </button>
        </div>

        {/* Dev note */}
        <div style={{ padding: '10px 24px 14px', background: T.devBg, borderTop: `1px solid ${T.devBorder}` }}>
          <p style={{ color: T.devText, fontSize: 10, lineHeight: 1.7 }}>
            <strong>Dev:</strong> PATCH /api/users/me — body: fullName, username, bio.
            Avatar: POST /api/users/avatar (multipart/form-data). 409 = username_taken.
          </p>
        </div>
      </div>
    </>
  );
}