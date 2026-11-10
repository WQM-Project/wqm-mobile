import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker, chosenDay } from '@/components/chip';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { TrackView } from '@/components/track-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { API_URL, useReadings } from '@/lib/api';
import { tick } from '@/lib/haptics';
import { agoLabel, dateLabel, dayKey, dayLabel, readingDays, timeLabel } from '@/lib/metrics';
import { boatTrack, isStale, latestBoatPosition, trackLength } from '@/lib/position';

const DAY_MS = 24 * 3600000;

// The app draws the GPS path itself (no map service or API key). For a real
// map with satellite views, it links to the web dashboard or the Maps app.
const DASHBOARD_URL = `${API_URL}/dashboard`;

export default function MapScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ day?: string }>();
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
      <TrackView position={position} track={track} />
      <View style={styles.links}>
        <LinkButton label="Full map on dashboard" primary onPress={() => Linking.openURL(DASHBOARD_URL)} />
        {position && (
          <LinkButton
            label="Open in Maps app"
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${position.latitude},${position.longitude}`)}
          />
        )}
      </View>

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
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {day
              ? `No GPS positions on ${dayLabel(day, true)}. Pick another date or go back to Latest.`
              : 'No packet has a GPS position yet. The path appears here once the gateway reports a settled fix.'}
          </ThemedText>
        )}
      </Card>
    </Screen>
  );
}

function LinkButton({ label, onPress, primary }: { label: string; onPress: () => unknown; primary?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        tick();
        void onPress();
      }}
      style={({ pressed }) => [
        styles.link,
        primary ? { backgroundColor: theme.accent } : { borderWidth: 1, borderColor: theme.border },
        pressed && { opacity: 0.75 },
      ]}>
      <ThemedText type="smallBold" numberOfLines={1} style={{ color: primary ? theme.background : theme.accent }}>
        {label}
      </ThemedText>
    </Pressable>
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
  links: { flexDirection: 'row', gap: Spacing.two },
  link: {
    flexGrow: 1,
    flexBasis: 0,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { flexGrow: 1, flexBasis: '40%', gap: 2 },
});
