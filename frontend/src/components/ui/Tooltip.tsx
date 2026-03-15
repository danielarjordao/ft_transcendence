import { useState } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const positions: Record<string, React.CSSProperties> = {
  top:    { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '6px' },
  bottom: { top: '100%',   left: '50%', transform: 'translateX(-50%)', marginTop: '6px' },
  left:   { right: '100%', top: '50%',  transform: 'translateY(-50%)', marginRight: '6px' },
  right:  { left: '100%',  top: '50%',  transform: 'translateY(-50%)', marginLeft: '6px' },
};

export function Tooltip({ text, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: 'absolute',
          ...positions[position],
          background: '#2A2A2A',
          border: '1px solid #3A3A3A',
          borderRadius: '6px',
          padding: '5px 9px',
          fontSize: '11px',
          color: '#F5F5F5',
          whiteSpace: 'nowrap',
          zIndex: 100,
          pointerEvents: 'none',
        }}>
          {text}
        </div>
      )}
    </div>
  );
}

// pointerEvents: 'none': tooltip não deve 
// interceptar eventos do mouse, caso contrário ele captura 
// o onMouseLeave do pai e some imediatamente ao aparecer
// criando um efeito de piscar