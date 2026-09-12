// API client + auth context for Roomzy
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import fetchAdapter from '@vespaiach/axios-fetch-adapter';
import { router } from 'expo-router';
import Constants from 'expo-constants';

// Resolve the backend base URL:
//  1) EXPO_PUBLIC_BACKEND_URL wins if set (use for staging/production HTTPS).
//  2) Otherwise derive the host from the Expo dev server (the machine running
//     Metro) and talk to :8001 there — so LAN testing "just works" on any
//     laptop without editing .env, as long as the phone is on the same Wi-Fi.
function resolveBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, '');

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host) return `http://${host}:8001`;

  return 'http://localhost:8001';
}

const BASE_URL = resolveBaseUrl();

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 30000,
  adapter: fetchAdapter,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('roomzy_token');
    if (token) {
      const headers: any = config.headers ?? {};
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (__DEV__) console.log('[api]', err?.config?.url, err?.response?.status, err?.response?.data || err?.message);
    return Promise.reject(err);
  }
);

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'tenant';
  avatar: string;
  isVerifiedOwner: boolean;
  subscriptionActive?: boolean;
  trialActive?: boolean;
  subscriptionUntil?: string | null;
  trialUntil?: string | null;
  favorites: string[];
  bio: string;
};

type AuthCtx = {
  user: User | null | undefined;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: 'owner' | 'tenant'; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  const refresh = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('roomzy_token');
      if (!token) { if (mounted.current) setUser(null); return; }
      const { data } = await api.get('/auth/me');
      if (mounted.current) setUser(data);
    } catch {
      if (mounted.current) setUser(null);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('roomzy_token', data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload: { name: string; email: string; password: string; role: 'owner' | 'tenant'; phone?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    await AsyncStorage.setItem('roomzy_token', data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem('roomzy_token');
    setUser(null);
    router.replace('/login');
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.delete('/users/account');
    await AsyncStorage.removeItem('roomzy_token');
    setUser(null);
    router.replace('/login');
  }, []);

  const value = useMemo(() => ({ user, login, register, logout, deleteAccount, refresh }), [user, login, register, logout, deleteAccount, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function formatErr(e: any): string {
  const d = e?.response?.data?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.map((x: any) => x?.msg || JSON.stringify(x)).join(', ');
  return e?.message || 'Something went wrong';
}
