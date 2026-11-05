import type { Reading } from './types';

// Same rule as the web dashboard (lib/map-config.ts): positions older than this
// when the gateway sent them are labelled as possibly outdated.
export const STALE_FIX_SECONDS = 120;

// Approximate IIT Mandi North Campus, shown until the first GPS packet arrives.
export const CAMPUS_REFERENCE = { latitude: 31.78129, longitude: 76.9975 };

export type BoatPosition = {
  latitude: number;
  longitude: number;
  recordedAt: string;
  fixAgeSeconds?: number;
};

// Newest packet carrying a GNSS position; packets without a fix are skipped.
export function latestBoatPosition(readings: Reading[]): BoatPosition | undefined {
  for (let i = readings.length - 1; i >= 0; i--) {
    const { recorded_at, payload } = readings[i];
    if (payload.lat !== undefined && payload.lon !== undefined)
      return {
        latitude: payload.lat,
        longitude: payload.lon,
        recordedAt: recorded_at,
        fixAgeSeconds: payload.gps_age_s,
      };
  }
  return undefined;
}

export function isStale(position: BoatPosition) {
  return (position.fixAgeSeconds ?? 0) >= STALE_FIX_SECONDS;
}
