export const colors = {

  primary: {
    purple: '#8b5cf6',
    purpleDark: '#7c3aed',
  },
  
  background: {
    navbar: '#1a1a1a',
    body: '#0f0f0f',
    card: '#262626',
  },

  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    muted: '#737373',
  },
  
  accent: {
    orange: '#f97316',
    green: '#10b981',
    red: '#ef4444',
  },
  
  border: {
    subtle: '#262626',
  },
} as const;

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
} as const;

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  full: '9999px',
} as const;