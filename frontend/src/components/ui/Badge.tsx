type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done';
type BadgeVariant = Priority | Status | string;

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  style?: React.CSSProperties;
}

const priorityColors: Record<Priority, { color: string }> = {
  high:   { color: '#ff6b6b' },
  medium: { color: '#FFA500' },
  low:    { color: '#888888' },
};

const statusColors: Record<Status, { color: string; background: string }> = {
  todo:        { color: '#888888', background: '#2A2A2A' },
  in_progress: { color: '#FFA500', background: '#2A1F00' },
  done:        { color: '#50C878', background: '#0D2414' },
};

const defaultLabels: Record<string, string> = {
  high:        'High',
  medium:      'Med',
  low:         'Low',
  todo:        'To Do',
  in_progress: 'In Progress',
  done:        'Done',
};

export function Badge({ variant, label, style }: BadgeProps) {
  const isPriority = variant in priorityColors;
  const isStatus   = variant in statusColors;

  if (isPriority) {
    const { color } = priorityColors[variant as Priority];
    return (
      <span style={{
        fontSize: '12px',
        fontWeight: 700,
        color,
        ...style,
      }}>
        {label ?? defaultLabels[variant]}
      </span>
    );
  }

  if (isStatus) {
    const { color, background } = statusColors[variant as Status];
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 600,
        color,
        background,
        ...style,
      }}>
        {label ?? defaultLabels[variant]}
      </span>
    );
  }

  // fallback para subjects ou qualquer string customizada
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '10px',
      fontSize: '11px',
      fontWeight: 600,
      color: '#cccccc',
      background: '#2A2A2A',
      ...style,
    }}>
      {label ?? variant}
    </span>
  );
}