import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useDeviceId } from '@/hooks/useDeviceId';
import type { AggregateData } from '@/types';

interface AppContextType {
  aggregateData: AggregateData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  submitJapam: (date: string, count: number) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const { deviceId } = useDeviceId();
  const [aggregateData, setAggregateData] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.fetchAggregates();
    if (res.ok) setAggregateData(res.data);
    else setError(res.error);
    setLoading(false);
  }, []);

  const submitJapam = useCallback(
    async (date: string, count: number) => {
      const res = await api.submitJapam(
        { name: user?.name ?? null, date, count, device_id: deviceId ?? undefined },
        token,
      );
      if (!res.ok) return { success: false, error: res.error };
      await refreshData();
      return { success: true };
    },
    [user, token, deviceId, refreshData],
  );

  useEffect(() => {
    let active = true;
    api.fetchAggregates().then((res) => {
      if (!active) return;
      if (res.ok) setAggregateData(res.data);
      else setError(res.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ aggregateData, loading, error, refreshData, submitJapam }),
    [aggregateData, loading, error, refreshData, submitJapam],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
