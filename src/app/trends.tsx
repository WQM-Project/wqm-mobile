import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker, chosenDay } from '@/components/chip';
import { LineChart } from '@/components/line-chart';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { tick } from '@/lib/haptics';
import {
  METRICS,
  dayKey,
  dayLabel,
  formatValue,
  pointLabel,
  readingDays,
  timeLabel,
  type MetricKey,
} from '@/lib/metrics';

const WINDOWS = [1, 6, 24] as const;

export default function TrendsScreen() {
  // The reading and day live in the route (?metric=pH&day=2026-11-06), so the
  // Overview screen and the controls below drive the same values.
  const params = useLocalSearchParams<{ metric?: string; day?: string }>();
  const [hours, setHours] = useState<(typeof WINDOWS)[number]>(24);
  const { data } = useReadings();
  const selectMetric = (key: MetricKey) => router.setParams({ metric: key });

  const metric = METRICS.find((m) => m.key === params.metric) ?? METRICS[0];
  const readings = data?.readings ?? [];
  const day = chosenDay(params.day, readingDays(readings));

  // A chosen day shows that whole IST day. Otherwise, like the web dashboard,
  // the window ends at the latest stored packet.
  const end = readings.length ? Date.parse(readings[readings.length - 1].recorded_at) : 0;
  const points = readings
    .filter((r) => (day ? dayKey(r.recorded_at) === day : Date.parse(r.recorded_at) >= end - hours * 3600000))
    .map((r) => ({
      t: Date.parse(r.recorded_at),
      value: r.payload[metric.key],
    }));
  const values = points.map((p) => p.value);
  const fmt = (v: number) => formatValue(metric, v);

  return (
    <Screen
      title="Trends"
      subtitle={day ? `${metric.label} on ${dayLabel(day, true)}` : `${metric.label}, last ${hours} h of data`}>
      {/* All twelve readings at once, three to a row, so nothing hides off-screen. */}
      <View style={styles.metricGrid}>
        {METRICS.map((m) => (
          <MetricTile key={m.key} label={m.short} active={m.key === metric.key} onPress={() => selectMetric(m.key)} />
        ))}
      </View>

      {/* A new key resets the zoom whenever the data window changes. */}
      {values.length > 0 && (
        <LineChart
          key={`${metric.key}-${day ?? hours}`}
          points={points}
          format={fmt}
          timeFormat={timeLabel}
          dateFormat={pointLabel}
        />
      )}

      {!day && (
        <Segmented options={WINDOWS.map((w) => ({ value: w, label: `${w}H` }))} value={hours} onChange={setHours} />
      )}
      <DatePicker day={day} days={readingDays(readings)} onChange={(d) => router.setParams({ day: d })} />

      {values.length > 0 ? (
        <Card style={styles.rows}>
          <Row label={day ? 'Last of day' : 'Latest'} value={fmt(values[values.length - 1])} />
          <Row label="Average" value={fmt(values.reduce((a, b) => a + b, 0) / values.length)} />
          <Row label="Range" value={`${fmt(Math.min(...values))} – ${fmt(Math.max(...values))}`} />
          <Row label="Time span" value={`${timeLabel(points[0].t)} – ${timeLabel(points[points.length - 1].t)} IST`} />
          <Row label="Readings" value={String(points.length)} last />
        </Card>
      ) : (
        <Card>
          <ThemedText type="smallBold">No readings {day ? `on ${dayLabel(day, true)}` : 'in this window'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            The boat did not upload any packets then. Pick another date or go back to Latest.
          </ThemedText>
        </Card>
      )}
    </Screen>
  );
}

// Text tabs with a pill behind the active one, like a stock app's 1D / 1W bar.
function Segmented<T extends number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              tick();
              onChange(o.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[styles.segment, active && { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold" themeColor={active ? 'text' : 'textSecondary'}>
              {o.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricTile({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: active ? theme.accent : theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
      ]}>
      <ThemedText
        type="smallBold"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ color: active ? theme.background : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: theme.border,
        },
      ]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    width: '31.8%',
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  segmented: { flexDirection: 'row', justifyContent: 'space-around' },
  segment: {
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  rows: { paddingVertical: Spacing.one, gap: 0 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two + 2,
  },
});
