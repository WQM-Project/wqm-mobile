import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { METRICS, dayKey } from './metrics';
import type { Reading } from './types';

// One row per packet. Times are given both in UTC (ISO) and IST so the file
// opens cleanly in Excel or Google Sheets and still reads naturally in India.
const COLUMNS = [
  'packet_id',
  'device_id',
  'recorded_at_utc',
  'recorded_at_ist',
  ...METRICS.map((m) => (m.unit ? `${m.key} (${m.unit})` : m.key)),
  'lat',
  'lon',
  'gps_fix',
  'gps_age_s',
];

const IST_OFFSET_MS = 330 * 60000;
const istStamp = (iso: string) => new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 19).replace('T', ' ');

// Quote a CSV cell only when it needs it.
const cell = (v: unknown) => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(readings: Reading[]) {
  const rows = readings.map((r) =>
    [
      r.packet_id,
      r.device_id,
      r.recorded_at,
      istStamp(r.recorded_at),
      ...METRICS.map((m) => r.payload[m.key]),
      r.payload.lat,
      r.payload.lon,
      r.payload.gps_fix,
      r.payload.gps_age_s,
    ]
      .map(cell)
      .join(','),
  );
  return [COLUMNS.join(','), ...rows].join('\n');
}

/**
 * Writes the readings to a CSV file and opens Android's share sheet, where the
 * user can save it to Files or Drive, or send it by mail or WhatsApp.
 */
export async function exportReadings(readings: Reading[], label: string) {
  if (!readings.length) throw new Error('There are no readings to export');
  const first = dayKey(readings[0].recorded_at);
  const last = dayKey(readings[readings.length - 1].recorded_at);
  const span = first === last ? first : `${first}_to_${last}`;
  const file = new File(Paths.cache, `wqm-${label}-${span}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.writeSync(toCsv(readings));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Save or share WQM readings',
  });
}
