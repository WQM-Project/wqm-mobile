import type { Reading } from './types';

// Same rule as the web dashboard (lib/map-config.ts): positions older than this
// when the gateway sent them are labelled as possibly outdated.
export const STALE_FIX_SECONDS = 120;


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

export type TrackPoint = { latitude: number; longitude: number; t: number };

// Every GPS position in the readings, oldest first.
export function boatTrack(readings: Reading[]): TrackPoint[] {
  return readings.flatMap(({ recorded_at, payload }) =>
    payload.lat !== undefined && payload.lon !== undefined
      ? [{ latitude: payload.lat, longitude: payload.lon, t: Date.parse(recorded_at) }]
      : [],
  );
}

// Great-circle distance in metres (haversine formula).
export function metresBetween(a: TrackPoint, b: TrackPoint) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function trackLength(track: TrackPoint[]) {
  let total = 0;
  for (let i = 1; i < track.length; i++) total += metresBetween(track[i - 1], track[i]);
  return total;
}

// Compass heading from a to b in degrees (0 = north, 90 = east).
export function bearing(a: TrackPoint, b: TrackPoint) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(rad(b.longitude - a.longitude)) * Math.cos(rad(b.latitude));
  const x =
    Math.cos(rad(a.latitude)) * Math.sin(rad(b.latitude)) -
    Math.sin(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.cos(rad(b.longitude - a.longitude));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
