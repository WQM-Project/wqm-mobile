// Mirrors the packet stored by wqm-web-dashboard (lib/server/ingest.ts) and the
// /api/dashboard response (lib/dashboard.ts). Keep the two in step.
export type Packet = {
  id: string;
  ts: number;
  pH: number;
  tds_ppm: number;
  do_mgl: number;
  orp_mv: number;
  temp_w1: number;
  temp_air: number;
  pressure_hpa: number;
  // Optional/reserved sensor fields (omitted on current STM32 build without those probes).
  turb_ntu?: number;
  ec_uscm?: number;
  temp_w2?: number;
  depth_cm?: number;
  humidity?: number;
  // Optional STM32 NEO-M8N GNSS and BNO085 IMU telemetry; gateway overrides GNSS when fixed.
  lat?: number;
  lon?: number;
  alt_m?: number;
  sog_knots?: number;
  cog_deg?: number;
  gps_fix?: boolean | number;
  sats?: number;
  gps_age_s?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
  utc_s?: number;
};

export type Reading = {
  packet_id: string;
  device_id: string;
  recorded_at: string;
  payload: Packet;
};

export type DashboardData = {
  source: 'demo' | 'gateway';
  readings: Reading[];
  checkedAt: string;
  truncated: boolean;
};
