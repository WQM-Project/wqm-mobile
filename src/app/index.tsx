import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { METRICS, agoLabel, dateLabel, formatValue } from '@/lib/metrics';
import { isStale, latestBoatPosition } from '@/lib/position';

const QUIET_AFTER_MS = 10 * 60000;

export default function OverviewScreen() {
  const { data } = useReadings();
  const readings = data?.readings ?? [];
  const latest = readings.at(-1);

  return (
    <Screen title="WQM" subtitle="River water quality, Boat 01">
      {!latest ? (
        <Card>
          <ThemedText type="smallBold">No readings yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Readings appear here as soon as the boat uploads its first packet.
          </ThemedText>
        </Card>
      ) : (
        <>
          <StatusCard readings={readings} />
          <View style={styles.grid}>
            {METRICS.map((metric) => (
              <Pressable
                key={metric.key}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                onPress={() => router.push({ pathname: '/trends', params: { metric: metric.key } })}>
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
            Latest packet received {dateLabel(latest.recorded_at)}. Tap a reading for its trend.
          </ThemedText>
        </>
      )}
    </Screen>
  );
}

function StatusCard({ readings }: { readings: NonNullable<ReturnType<typeof useReadings>['data']>['readings'] }) {
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

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cell: { width: '48.5%' },
  pressed: { opacity: 0.7 },
  metricCard: { minHeight: 88, justifyContent: 'space-between' },
  value: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 8, height: 8, borderRadius: 4 },
  footnote: { marginTop: Spacing.one },
});
