// ThemeProvider - persists user choice, bumps `themeKey` to force remount
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyTheme } from './theme';

type Mode = 'light' | 'dark' | 'system';

type Ctx = {
  mode: Mode;
  effective: 'light' | 'dark';
  setMode: (m: Mode) => Promise<void>;
  toggle: () => Promise<void>;
  themeKey: number;
};

const ThemeContext = createContext<Ctx | null>(null);

const STORAGE_KEY = 'roomzy_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<Mode>('system');
  const [themeKey, setThemeKey] = useState(0);
  const effective: 'light' | 'dark' = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;

  // load persisted mode once
  useEffect(() => {
    (async () => {
      try {
        const saved = (await AsyncStorage.getItem(STORAGE_KEY)) as Mode | null;
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setModeState(saved);
        }
      } catch {}
    })();
  }, []);

  // apply whenever effective mode changes
  useEffect(() => {
    applyTheme(effective);
    setThemeKey((k) => k + 1);
  }, [effective]);

  const setMode = useCallback(async (m: Mode) => {
    setModeState(m);
    try { await AsyncStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const toggle = useCallback(async () => {
    const next: Mode = effective === 'dark' ? 'light' : 'dark';
    await setMode(next);
  }, [effective, setMode]);

  const value = useMemo(() => ({ mode, effective, setMode, toggle, themeKey }), [mode, effective, setMode, toggle, themeKey]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be inside ThemeProvider');
  return ctx;
}
