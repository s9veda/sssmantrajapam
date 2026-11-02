import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { useDeviceId } from '@/hooks/useDeviceId';
import type { AuthResult, User } from '@/types';

const SESSION_KEY = '@sssmantrajapam_session';

type OtpType = 'signup' | 'signin';
type ActionResult = { success: true } | { success: false; error: string };

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  reviewLoginEnabled: boolean;
  sendOTP: (contact: string, type: OtpType, name?: string) => Promise<ActionResult>;
  verifyOTP: (contact: string, code: string, type: OtpType, name?: string) => Promise<ActionResult>;
  reviewLogin: (email: string, password: string) => Promise<ActionResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoginEnabled, setReviewLoginEnabled] = useState(false);
  const { deviceId } = useDeviceId();

  const persist = useCallback(async (value: AuthResult | null) => {
    setSession(value);
    try {
      if (value) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(value));
      else await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // Storage failures only cost persistence; the in-memory session still works.
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        const stored = raw ? (JSON.parse(raw) as AuthResult) : null;
        if (stored?.token) {
          if (active) setSession(stored);
          const res = await api.getSession(stored.token);
          if (!active) return;
          if (res.ok) setSession({ token: stored.token, user: res.data.user });
          else if (res.status === 401) await persist(null);
        }
      } catch {
        // Ignore corrupt stored sessions.
      } finally {
        if (active) setLoading(false);
      }
    })();
    api.reviewLoginEnabled().then((res) => {
      if (active) setReviewLoginEnabled(res.ok && res.data.enabled === true);
    });
    return () => {
      active = false;
    };
  }, [persist]);

  const sendOTP = useCallback<AuthContextType['sendOTP']>(async (contact, type, name) => {
    const res = await api.sendOTP(contact.trim().toLowerCase(), type, name);
    return res.ok ? { success: true } : { success: false, error: res.error };
  }, []);

  const verifyOTP = useCallback<AuthContextType['verifyOTP']>(
    async (contact, code, type, name) => {
      const res = await api.verifyOTP(contact.trim().toLowerCase(), code, type, name, deviceId ?? undefined);
      if (!res.ok) return { success: false, error: res.error };
      await persist(res.data);
      return { success: true };
    },
    [deviceId, persist],
  );

  const reviewLogin = useCallback<AuthContextType['reviewLogin']>(
    async (email, password) => {
      const res = await api.reviewLogin(email.trim(), password);
      if (!res.ok) return { success: false, error: res.error };
      await persist(res.data);
      return { success: true };
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, token: session?.token ?? null, loading, reviewLoginEnabled, sendOTP, verifyOTP, reviewLogin, logout }),
    [session, loading, reviewLoginEnabled, sendOTP, verifyOTP, reviewLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
