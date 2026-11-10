import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker, chosenDay } from '@/components/chip';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { tick } from '@/lib/haptics';
import { METRICS, agoLabel, dateLabel, dayKey, dayLabel, formatValue, readingDays, timeLabel } from '@/lib/metrics';
import { isStale, latestBoatPosition } from '@/lib/position';
import type { Reading } from '@/lib/types';

const QUIET_AFTER_MS = 10 * 60000;

export default function OverviewScreen() {
  // The chosen day lives in the route (?day=2026-11-06) so Trends can share it.
  const params = useLocalSearchParams<{ day?: string }>();
  const { data } = useReadings();
  const readings = data?.readings ?? [];
  const day = chosenDay(params.day, readingDays(readings));
  const shown = day ? readings.filter((r) => dayKey(r.recorded_at) === day) : readings;
  const latest = shown.at(-1);
  const picker = readings.length > 0 && (
    <DatePicker day={day} days={readingDays(readings)} onChange={(d) => router.setParams({ day: d })} />
  );

  return (
    <Screen title="WQM" subtitle="River water quality, Boat 01">
      {picker}
      {day && !latest ? (
        <Card>
          <ThemedText type="smallBold">No readings on {dayLabel(day, true)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The boat did not upload any packets that day. Pick another date or go back to Latest.
          </ThemedText>
        </Card>
      ) : !latest ? (
        <Card>
          <ThemedText type="smallBold">No readings yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Readings appear here as soon as the boat uploads its first packet.
          </ThemedText>
        </Card>
      ) : (
        <>
          {day ? <DayCard day={day} readings={shown} /> : <StatusCard readings={readings} />}
          <View style={styles.grid}>
            {METRICS.map((metric) => (
              <Pressable
                key={metric.key}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                onPress={() => {
                  tick();
                  router.push({ pathname: '/trends', params: day ? { metric: metric.key, day } : { metric: metric.key } });
                }}>
                <Card style={styles.metricCard}>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {metric.label}
                  </ThemedText>
                  <ThemedText style={styles.value}>{formatValue(metric, latest.payload[metric.key])}</ThemedText>
                </Card>
              </Pressable>
            ))}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.footnote}>
            {day ? 'Last reading of the day' : 'Latest packet'} received {dateLabel(latest.recorded_at)}. Tap a
            reading for its trend.
          </ThemedText>
        </>
      )}
    </Screen>
  );
}

function StatusCard({ readings }: { readings: Reading[] }) {
  const theme = useTheme();
  // Ages are measured against the last fetch, which refreshes every minute.
  const { dataUpdatedAt: now } = useReadings();
  const latest = readings[readings.length - 1];
  const position = latestBoatPosition(readings);
  // Amber once the boat has been quiet for longer than a few missed readings.
  const quiet = now - Date.parse(latest.recorded_at) > QUIET_AFTER_MS;
  const gps = !position
    ? { text: 'GPS pending', color: theme.textSecondary }
    : isStale(position)
      ? { text: 'Last GPS position may be outdated', color: theme.warning }
      : { text: 'GPS position current', color: theme.accent };
  return (
    <Card>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: quiet ? theme.warning : theme.accent }]} />
        <ThemedText type="smallBold" style={quiet ? { color: theme.warning } : undefined}>
          Last packet {agoLabel(latest.recorded_at, now)}
        </ThemedText>
      </View>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: gps.color }]} />
        <ThemedText type="small" style={{ color: gps.color }}>{gps.text}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {readings.length} packets loaded. Pull down to refresh.
      </ThemedText>
    </Card>
  );
}

// Summary for a past day: when the boat reported and how often.
function DayCard({ day, readings }: { day: string; readings: Reading[] }) {
  const theme = useTheme();
  const first = readings[0].recorded_at;
  const last = readings[readings.length - 1].recorded_at;
  return (
    <Card>
      <View style={styles.statusRow}>
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        <ThemedText type="smallBold">Viewing {dayLabel(day, true)}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {readings.length} {readings.length === 1 ? 'packet' : 'packets'} between {timeLabel(first)} and{' '}
        {timeLabel(last)} IST. Values below are the last reading of the day.
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Two per row at any screen width: each grows to fill, gaps included.
  cell: { flexGrow: 1, flexBasis: '40%' },
  pressed: { opacity: 0.7 },
  metricCard: { minHeight: 88, justifyContent: 'space-between' },
  value: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footnote: { marginTop: Spacing.one },
});
