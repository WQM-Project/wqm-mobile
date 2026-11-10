import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { BoatMap, type MapStyle } from '@/components/boat-map';
import { Card } from '@/components/card';
import { Chip, DatePicker, chosenDay } from '@/components/chip';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { tick } from '@/lib/haptics';
import { agoLabel, dateLabel, dayKey, dayLabel, readingDays, timeLabel } from '@/lib/metrics';
import { boatTrack, isStale, latestBoatPosition, trackLength } from '@/lib/position';

const DAY_MS = 24 * 3600000;

// Google map views. Satellite and hybrid show the real river and banks.
const VIEWS: { value: MapStyle; label: string }[] = [
  { value: 'standard', label: 'Normal' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function MapScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
  const [view, setView] = useState<MapStyle>('standard');
  const { data } = useReadings();
  const readings = data?.readings ?? [];
  const day = chosenDay(params.day, readingDays(readings));

  // Latest: the last 24 h of data, ending at the newest packet. A day: that IST day.
  const end = readings.length ? Date.parse(readings[readings.length - 1].recorded_at) : 0;
  const inView = day
    ? readings.filter((r) => dayKey(r.recorded_at) === day)
    : readings.filter((r) => Date.parse(r.recorded_at) > end - DAY_MS);
  const position = latestBoatPosition(inView) ?? (day ? undefined : latestBoatPosition(readings));
  const track = boatTrack(inView);
  const metres = trackLength(track);

  return (
    <Screen
      title="Boat location"
      subtitle={day ? `Track on ${dayLabel(day, true)}` : position ? 'Path over the last 24 h of data' : 'GPS pending'}>
      <DatePicker day={day} days={readingDays(readings)} onChange={(d) => router.setParams({ day: d })} />
      {/* A new key refits the map whenever the track changes. */}
      <View style={styles.views}>
        {VIEWS.map((v) => (
          <Chip key={v.value} label={v.label} active={v.value === view} onPress={() => setView(v.value)} />
        ))}
      </View>
      <BoatMap key={`${day ?? 'latest'}-${track.length}`} position={position} track={track} mapType={view} />

      {track.length > 1 && (
        <View style={styles.stats}>
          <Stat
            label="Distance"
            value={metres >= 1000 ? `${(metres / 1000).toFixed(2)} km` : `${Math.round(metres)} m`}
          />
          <Stat label="GPS fixes" value={String(track.length)} />
          <Stat label="From" value={`${timeLabel(track[0].t)}`} />
          <Stat label="To" value={`${timeLabel(track[track.length - 1].t)} IST`} />
        </View>
      )}

      <Card>
        {position ? (
          <>
            <ThemedText type="smallBold">
              {coordinate(position.latitude, 'N', 'S')}, {coordinate(position.longitude, 'E', 'W')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Last position {dateLabel(position.recordedAt)} ({agoLabel(position.recordedAt)}).
            </ThemedText>
            {isStale(position) && (
              <ThemedText type="small" style={{ color: theme.warning }}>
                Position was {Math.round((position.fixAgeSeconds ?? 0) / 60)} min old when sent; the boat may have
                moved.
              </ThemedText>
            )}
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                tick();
                void Linking.openURL(`https://maps.google.com/?q=${position.latitude},${position.longitude}`);
              }}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Open in Google Maps
              </ThemedText>
            </Pressable>
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {day
              ? `No GPS positions on ${dayLabel(day, true)}. Pick another date or go back to Latest.`
              : 'No packet has a GPS position yet. The map shows the IIT Mandi North Campus reference until the gateway reports a settled fix.'}
          </ThemedText>
        )}
      </Card>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </Card>
  );
}

const coordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(6)}° ${value >= 0 ? positive : negative}`;

const styles = StyleSheet.create({
  views: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { width: '48.5%', gap: 2 },
});
