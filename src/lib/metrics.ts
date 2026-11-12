// Same labels, units and precision as the web dashboard (lib/dashboard.ts).
// `short` fits the Trends picker grid.
export const METRICS = [
  { key: 'pH', label: 'pH', short: 'pH', unit: '', decimals: 2 },
  { key: 'do_mgl', label: 'Dissolved oxygen', short: 'Oxygen', unit: 'mg/L', decimals: 2 },
  { key: 'tds_ppm', label: 'Dissolved solids', short: 'TDS', unit: 'ppm', decimals: 1 },
  { key: 'temp_w1', label: 'Water temperature', short: 'Water temp', unit: '°C', decimals: 1 },
  { key: 'orp_mv', label: 'Redox potential', short: 'Redox', unit: 'mV', decimals: 1 },
  { key: 'temp_air', label: 'Air temperature', short: 'Air temp', unit: '°C', decimals: 1 },
  { key: 'pressure_hpa', label: 'Pressure', short: 'Pressure', unit: 'hPa', decimals: 1 },
  { key: 'turb_ntu', label: 'Turbidity', short: 'Turbidity', unit: 'NTU', decimals: 1 },
  { key: 'ec_uscm', label: 'Conductivity', short: 'Conductivity', unit: 'µS/cm', decimals: 1 },
  { key: 'temp_w2', label: 'Backup water temperature', short: 'Backup temp', unit: '°C', decimals: 1 },
  { key: 'depth_cm', label: 'Depth', short: 'Depth', unit: 'cm', decimals: 1 },
  { key: 'humidity', label: 'Humidity', short: 'Humidity', unit: '%', decimals: 1 },
] as const;

export type Metric = (typeof METRICS)[number];
export type MetricKey = Metric['key'];

export function formatValue(metric: Metric, value?: number) {
  if (value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(metric.decimals)}${metric.unit ? ` ${metric.unit}` : ''}`;
}

// IST is a fixed UTC+5:30 with no daylight saving, so format it by hand rather
// than relying on Intl time-zone data, which varies between Android engines.
const IST_OFFSET_MS = 330 * 60000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

function ist(value: string | number) {
  return new Date(new Date(value).getTime() + IST_OFFSET_MS);
}

export function timeLabel(value: string | number) {
  const d = ist(value);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

export function dateLabel(value: string | number) {
  const d = ist(value);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${timeLabel(value)} IST`;
}

// "just now", "4 min ago", "2 h ago", "3 days ago".
export function agoLabel(value: string | number, now = Date.now()) {
  const seconds = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  const days = Math.floor(seconds / 86400);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

// Calendar day in IST as "YYYY-MM-DD", so a 23:50 IST packet stays on its own day.
export function dayKey(value: string | number) {
  const d = ist(value);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// "6 Nov at 10:12" for the chart's scrub label.
export function pointLabel(value: string | number) {
  const d = ist(value);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} at ${timeLabel(value)}`;
}

// "6 Nov" for a day key; add the year when it is not the current one.
export function dayLabel(key: string, withYear = false) {
  const [y, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

// Days that have at least one reading, newest first.
export function readingDays(readings: { recorded_at: string }[]) {
  return [...new Set(readings.map((r) => dayKey(r.recorded_at)))].reverse();
}
