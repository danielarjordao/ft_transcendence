import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: number;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, width = 520, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          width,
          maxWidth: '95vw',
          maxHeight: '90vh',
          background: '#1A1A1A',
          border: '1px solid #3A3A3A',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid #2A2A2A',
            flexShrink: 0,
          }}>
            <span style={{ color: '#F5F5F5', fontSize: '14px', fontWeight: 600 }}>
              {title}
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#888888',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                padding: '2px 4px',
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}