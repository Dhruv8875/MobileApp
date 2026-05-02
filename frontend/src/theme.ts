// Roomzy theme - logo-matched blue + orange, with light & dark mode
// The `Colors` export is a mutable object; call applyTheme('light'|'dark')
// and the ThemeProvider bumps a remount key so the tree reads fresh values.

export const lightPalette = {
  primary: '#2E5CFF',        // logo blue
  primaryLight: '#E5EDFF',
  primaryDark: '#1D3FCC',
  accent: '#FF7A2B',          // logo orange
  accentLight: '#FFE8D6',
  secondary: '#0F172A',
  bg: '#FFFFFF',
  bgAlt: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FB',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  shadow: 'rgba(15,23,42,0.08)',
  tabBar: '#FFFFFF',
  headerBg: '#FFFFFF',
  headerFg: '#0F172A',
  cardShadow: 'rgba(15,23,42,0.08)',
  isDark: false as boolean,
};

export const darkPalette: typeof lightPalette = {
  primary: '#5C83FF',         // lighter blue for dark contrast
  primaryLight: '#1A2345',
  primaryDark: '#2E5CFF',
  accent: '#FF8A3D',
  accentLight: '#3A2314',
  secondary: '#F5F7FB',
  bg: '#0B0F1A',
  bgAlt: '#121826',
  surface: '#151B29',
  surfaceAlt: '#1A2133',
  text: '#F5F7FB',
  textMuted: '#94A3B8',
  border: '#1F2940',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  shadow: 'rgba(0,0,0,0.4)',
  tabBar: '#0F1524',
  headerBg: '#0B0F1A',
  headerFg: '#F5F7FB',
  cardShadow: 'rgba(0,0,0,0.5)',
  isDark: true,
};

// Mutable object that components read from.
export const Colors: typeof lightPalette = { ...lightPalette };

export function applyTheme(mode: 'light' | 'dark') {
  const src = mode === 'dark' ? darkPalette : lightPalette;
  (Object.keys(src) as Array<keyof typeof src>).forEach((k) => {
    (Colors as any)[k] = src[k];
  });
}

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, full: 9999 };

export const Type = {
  h1: { fontSize: 32, fontWeight: '900' as const, letterSpacing: -0.8 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.2 },
};
