// Roomzy theme - colors, spacing, typography
export const Colors = {
  primary: '#FF385C',
  primaryLight: '#FFE8EC',
  primaryDark: '#E11D48',
  secondary: '#222222',
  bg: '#FFFFFF',
  bgAlt: '#F7F7F7',
  surface: '#FFFFFF',
  text: '#222222',
  textMuted: '#717171',
  border: '#EBEBEB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadow: 'rgba(0,0,0,0.08)',
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 };

export const Type = {
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.8, color: Colors.text },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4, color: Colors.text },
  h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2, color: Colors.text },
  body: { fontSize: 15, color: Colors.text },
  bodyMuted: { fontSize: 14, color: Colors.textMuted },
  caption: { fontSize: 12, color: Colors.textMuted, fontWeight: '600' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const },
  label: { fontSize: 13, fontWeight: '600' as const, color: Colors.text },
};
