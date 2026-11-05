// Same labels, units and precision as the web dashboard (lib/dashboard.ts).
export const METRICS = [
  { key: 'pH', label: 'pH', unit: '', decimals: 2 },
  { key: 'turb_ntu', label: 'Turbidity', unit: 'NTU', decimals: 1 },
  { key: 'do_mgl', label: 'Dissolved oxygen', unit: 'mg/L', decimals: 2 },
  { key: 'temp_w1', label: 'Water temperature', unit: '°C', decimals: 1 },
  { key: 'tds_ppm', label: 'Dissolved solids', unit: 'ppm', decimals: 1 },
  { key: 'ec_uscm', label: 'Conductivity', unit: 'µS/cm', decimals: 1 },
  { key: 'orp_mv', label: 'Redox potential', unit: 'mV', decimals: 1 },
  { key: 'temp_w2', label: 'Backup water temperature', unit: '°C', decimals: 1 },
  { key: 'depth_cm', label: 'Depth', unit: 'cm', decimals: 1 },
  { key: 'temp_air', label: 'Air temperature', unit: '°C', decimals: 1 },
  { key: 'humidity', label: 'Humidity', unit: '%', decimals: 1 },
  { key: 'pressure_hpa', label: 'Pressure', unit: 'hPa', decimals: 1 },
] as const;

export type Metric = (typeof METRICS)[number];
export type MetricKey = Metric['key'];

export function formatValue(metric: Metric, value: number) {
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
  return `${Math.floor(seconds / 86400)} days ago`;
}
