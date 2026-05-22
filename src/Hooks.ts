import { useState, useEffect, useCallback } from 'react';
import axiosInstance from './Axios';
import { StatsData, DryStatsData } from './Tokens';

export function useStats(token?: string) {
  const [data, setData]       = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get('/merchants/stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load stats');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

export function useDryStats(token?: string) {
  const [data, setData]       = useState<DryStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await axiosInstance.get('/merchants/dry-cleaner-stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setData(res.data?.data ?? res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load dry stats');
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}