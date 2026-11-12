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
  // Onboard SIM7600 GNSS supplies primary lat/lon/gps_fix when fixed; optional STM32 GNSS pass-through & BNO085 IMU telemetry.
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
