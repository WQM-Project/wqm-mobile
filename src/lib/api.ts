import { useQuery } from '@tanstack/react-query';

import type { DashboardData } from './types';

// The web dashboard's read-only endpoint. It reads the database with a server
// key, so the app never holds database credentials. Override for local testing
// with EXPO_PUBLIC_API_URL in .env (e.g. http://192.168.1.20:3000).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://wqm-web-dashboard.vercel.app').replace(/\/$/, '');

export async function fetchReadings(): Promise<DashboardData> {
  const response = await fetch(`${API_URL}/api/dashboard?source=gateway`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Server replied ${response.status}`);
  const data = (await response.json()) as DashboardData;
  if (!Array.isArray(data.readings)) throw new Error('Unexpected server response');
  return data;
}

// Readings arrive oldest first. Refreshes every minute while the app is open.
export function useReadings() {
  return useQuery({
    queryKey: ['readings', 'gateway'],
    queryFn: fetchReadings,
    refetchInterval: 60000,
  });
}
