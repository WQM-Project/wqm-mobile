import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { LineChart } from '@/components/line-chart';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { METRICS, formatValue, timeLabel, type MetricKey } from '@/lib/metrics';

const WINDOWS = [1, 6, 24] as const;

export default function TrendsScreen() {
  // The selected reading lives in the route (?metric=pH), so Overview cards and
  // the chips below drive the same value.
  const params = useLocalSearchParams<{ metric?: string }>();
  const [hours, setHours] = useState<(typeof WINDOWS)[number]>(24);
  const { data } = useReadings();
  const selectMetric = (key: MetricKey) => router.setParams({ metric: key });

  const metric = METRICS.find((m) => m.key === params.metric) ?? METRICS[0];
  const readings = data?.readings ?? [];
  // Like the web dashboard, the window ends at the latest stored packet.
  const end = readings.length ? Date.parse(readings[readings.length - 1].recorded_at) : 0;
  const points = readings
    .map((r) => ({ t: Date.parse(r.recorded_at), value: r.payload[metric.key] }))
    .filter((p) => p.t >= end - hours * 3600000);
  const values = points.map((p) => p.value);
  const fmt = (v: number) => formatValue(metric, v);

  return (
    <Screen title="Trends" subtitle={`${metric.label} over the last ${hours} h of data`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {METRICS.map((m) => (
          <Chip key={m.key} label={m.label} active={m.key === metric.key} onPress={() => selectMetric(m.key)} />
        ))}
      </ScrollView>
      <View style={styles.windows}>
        {WINDOWS.map((w) => (
          <Chip key={w} label={`${w} h`} active={w === hours} onPress={() => setHours(w)} />
        ))}
      </View>
      <Card>
        <LineChart points={points} format={fmt} timeFormat={timeLabel} />
      </Card>
      {values.length > 0 && (
        <View style={styles.stats}>
          <Stat label="Latest" value={fmt(values[values.length - 1])} />
          <Stat label="Average" value={fmt(values.reduce((a, b) => a + b, 0) / values.length)} />
          <Stat label="Min" value={fmt(Math.min(...values))} />
          <Stat label="Max" value={fmt(Math.max(...values))} />
        </View>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        {points.length} readings in this window.
      </ThemedText>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.chip,
        { borderColor: active ? theme.accent : theme.border, backgroundColor: active ? theme.accent : 'transparent' },
      ]}>
      <ThemedText type="small" style={{ color: active ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  chips: { gap: Spacing.two, paddingRight: Spacing.three },
  windows: { flexDirection: 'row', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: { width: '48.5%', gap: Spacing.one },
});
