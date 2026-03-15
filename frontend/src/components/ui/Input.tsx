interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
}

export function Input({
  label,
  error,
  hint,
  multiline = false,
  style,
  ...props
}: InputProps) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    background: '#222222',
    border: `1px solid ${error ? '#ff6b6b' : '#3A3A3A'}`,
    borderRadius: '8px',
    padding: '9px 12px',
    color: '#F5F5F5',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    resize: 'vertical',
    ...style,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '11px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          rows={3}
          style={{ ...baseStyle, minHeight: '80px' }}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input style={baseStyle} {...props} />
      )}
      {error && (
        <span style={{ fontSize: '12px', color: '#ff6b6b' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: '12px', color: '#666666' }}>{hint}</span>
      )}
    </div>
  );
}