import { useState, useEffect, useRef } from 'react';

export interface DropdownOption {
  label: string;
  value: string;
  danger?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  onSelect: (value: string) => void;
  trigger: React.ReactNode;
}

export function Dropdown({ options, onSelect, trigger }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);//padrão para fechar dropdown ao clicar fora
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: '#1A1A1A',
          border: '1px solid #3A3A3A',
          borderRadius: '8px',
          padding: '4px',
          minWidth: '160px',
          zIndex: 90,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onSelect(opt.value); setOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: opt.danger ? '#ff6b6b' : '#F5F5F5',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#2A2A2A')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}