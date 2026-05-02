// API client + auth context for Roomzy
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('roomzy_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'tenant';
  avatar: string;
  isVerifiedOwner: boolean;
  favorites: string[];
  bio: string;
};

type AuthCtx = {
  user: User | null | undefined; // undefined = loading
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: 'owner' | 'tenant'; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('roomzy_token');
      if (!token) {
        setUser(null);
        return;
      }
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('roomzy_token', data.token);
    setUser(data.user);
  };

  const register = async (payload: { name: string; email: string; password: string; role: 'owner' | 'tenant'; phone?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    await AsyncStorage.setItem('roomzy_token', data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.removeItem('roomzy_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, refresh, setUser }}>
      {children}
    </AuthContext.Provider>
  );
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
