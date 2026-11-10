import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { useTheme } from '@/hooks/use-theme';
import { CAMPUS_REFERENCE, bearing, type BoatPosition, type TrackPoint } from '@/lib/position';

// Top-down boat, bow up; Metro picks the @2x/@3x file for the screen density.
const BOAT = require('@/assets/images/boat-marker.png');

// Android/iOS map. Expo Go needs no API key; store builds need one (see README).
// Draws the GPS track as a line, a small dot where it starts and the boat at
// the newest position. Change the `key` to refit the view to a new track.
export function BoatMap({ position, track = [] }: { position?: BoatPosition; track?: TrackPoint[] }) {
  const theme = useTheme();
  const points = track.length ? track : position ? [position] : [CAMPUS_REFERENCE];
  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  // Fit the whole track with a margin, but never zoom in past street level.
  const region = {
    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
    longitude: (Math.min(...lons) + Math.max(...lons)) / 2,
    latitudeDelta: Math.max((Math.max(...lats) - Math.min(...lats)) * 1.6, 0.003),
    longitudeDelta: Math.max((Math.max(...lons) - Math.min(...lons)) * 1.6, 0.003),
  };
  const start = track[0];
  // Point the bow the way the boat last moved.
  const heading = track.length > 1 ? bearing(track[track.length - 2], track[track.length - 1]) : 0;

  return (
    <MapView style={styles.map} initialRegion={region} toolbarEnabled={false}>
      {track.length > 1 && (
        <>
          {/* A wide pale halo under a navy line keeps the path readable on any tile. */}
          <Polyline coordinates={track} strokeColor="rgba(255,255,255,0.85)" strokeWidth={8} lineJoin="round" />
          <Polyline coordinates={track} strokeColor={theme.accent} strokeWidth={4} lineJoin="round" lineCap="round" />
        </>
      )}
      {start && track.length > 1 && (
        <Marker coordinate={start} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false} title="Track start">
          <View style={[styles.start, { borderColor: theme.accent }]} />
        </Marker>
      )}
      {position && (
        <Marker
          coordinate={position}
          image={BOAT}
          anchor={{ x: 0.5, y: 0.5 }}
          rotation={heading}
          flat
          title="Boat 01"
          description="Last GPS position"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 380, borderRadius: 20, overflow: 'hidden' },
  start: { width: 14, height: 14, borderRadius: 7, borderWidth: 3, backgroundColor: '#ffffff' },
});
