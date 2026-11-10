import { useSyncExternalStore } from 'react';

// Which dataset the app shows. The API names are the web dashboard's:
// 'demo' reads the generated test set (DEMO-001), 'gateway' the real boat (WQM-001).
export type DataSource = 'demo' | 'gateway';

// What people see in the app, e.g. during a presentation.
export const SOURCE_LABELS: Record<DataSource, string> = {
  demo: 'Simulated',
  gateway: 'Field test',
};

// Starting value: EXPO_PUBLIC_DATA_SOURCE=gateway in .env.local starts on field
// data; otherwise the app opens on the simulated set.
let current: DataSource = process.env.EXPO_PUBLIC_DATA_SOURCE === 'gateway' ? 'gateway' : 'demo';
const listeners = new Set<() => void>();

export function setDataSource(next: DataSource) {
  if (next === current) return;
  current = next;
  listeners.forEach((notify) => notify());
}

// Every screen shares one value, so flipping the switch anywhere updates all tabs.
export function useDataSource() {
  return useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    () => current,
  );
}
