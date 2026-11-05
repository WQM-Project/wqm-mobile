import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

import { CAMPUS_REFERENCE, type BoatPosition } from '@/lib/position';

// Android/iOS map. Expo Go needs no API key; store builds need one (see README).
export function BoatMap({ position }: { position?: BoatPosition }) {
  const center = position ?? CAMPUS_REFERENCE;
  const region = { ...center, latitudeDelta: 0.006, longitudeDelta: 0.006 };
  return (
    <MapView style={styles.map} region={region} toolbarEnabled={false}>
      {position && (
        <Marker coordinate={position} title="Boat 01" description="Last GPS position" />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 360, borderRadius: 16, overflow: 'hidden' },
});
