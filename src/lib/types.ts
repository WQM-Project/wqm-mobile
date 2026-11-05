// Mirrors the packet stored by wqm-web-dashboard (lib/server/ingest.ts) and the
// /api/dashboard response (lib/dashboard.ts). Keep the two in step.
export type Packet = {
  id: string;
  ts: number;
  pH: number;
  turb_ntu: number;
  tds_ppm: number;
  do_mgl: number;
  ec_uscm: number;
  orp_mv: number;
  temp_w1: number;
  temp_w2: number;
  depth_cm: number;
  temp_air: number;
  humidity: number;
  pressure_hpa: number;
  // Added by the gateway; GPS fields are absent until it has a settled fix.
  lat?: number;
  lon?: number;
  gps_fix?: boolean;
  gps_age_s?: number;
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
