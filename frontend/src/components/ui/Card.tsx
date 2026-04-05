import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

const paddings = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const isClickable = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={`
        rounded-xl border
        ${paddings[padding]}
        ${isClickable ? 'cursor-pointer transition-colors' : ''}
        ${className}
      `}
      style={{
        background: '#1A1A1A',
        borderColor: '#2A2A2A',
      }}
    >
      {children}
    </div>
  );
}