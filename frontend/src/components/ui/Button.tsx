type Variant = 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: '#7B68EE', color: '#ffffff', border: 'none' },
  ghost:   { background: 'transparent', color: '#cccccc', border: '1px solid #3A3A3A' },
  danger:  { background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b' },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: '6px' },
  md: { padding: '8px 16px', fontSize: '14px', borderRadius: '8px' },
  lg: { padding: '11px 22px', fontSize: '15px', borderRadius: '10px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
        fontFamily: 'inherit',
        lineHeight: 1,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      {...props}
    >
      {loading ? '...' : children}
    </button>
  );
}