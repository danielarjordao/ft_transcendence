type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  style?: React.CSSProperties;
}

const dimensions: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 48,
};

const fontSizes: Record<AvatarSize, number> = {
  sm: 9,
  md: 12,
  lg: 18,
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .trim()
    .split(/[\s_]+/)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

function stringToColor(name?: string): string {
  if (!name) return '#3A3A3A';
  const colors = [
    '#7B68EE', '#4A90D9', '#50C878',
    '#FFA500', '#E87D7D', '#9B8EC4',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', style }: AvatarProps) {
  const dim = dimensions[size];
  const fs  = fontSizes[size];

  const base: React.CSSProperties = {
    width: dim,
    height: dim,
    minWidth: dim,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: fs,
    fontWeight: 700,
    userSelect: 'none',
    flexShrink: 0,
    ...style,
  };

  if (src) {
    return (
      <div style={base}>
        <img
          src={src}
          alt={name ?? 'avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      ...base,
      background: stringToColor(name),
      color: '#ffffff',
    }}>
      {getInitials(name)}
    </div>
  );
}