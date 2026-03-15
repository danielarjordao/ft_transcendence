interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      textAlign: 'center',
      gap: '10px',
    }}>
      {icon && <span style={{ fontSize: '32px', lineHeight: 1 }}>{icon}</span>}
      <p style={{
        color: '#F5F5F5',
        fontSize: '14px',
        fontWeight: 600,
        margin: 0,
      }}>
        {title}
      </p>
      {description && (
        <p style={{
          color: '#888888',
          fontSize: '12px',
          lineHeight: 1.6,
          maxWidth: '220px',
          margin: 0,
        }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: '6px' }}>
          {action}
        </div>
      )}
    </div>
  );
}