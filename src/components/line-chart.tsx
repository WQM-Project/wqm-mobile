import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type ChartPoint = { t: number; value: number };

// Minimal time-series line: max above, min below, start/end times at the bottom.
export function LineChart({
  points,
  height = 160,
  format,
  timeFormat,
}: {
  points: ChartPoint[];
  height?: number;
  format: (value: number) => string;
  timeFormat: (t: number) => string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (points.length < 2)
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Not enough readings in this window to draw a trend.
      </ThemedText>
    );

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const t0 = points[0].t;
  const tSpan = points[points.length - 1].t - t0 || 1;
  const pad = 6;
  const x = (t: number) => pad + ((t - t0) / tSpan) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / span) * (height - pad * 2);
  const last = points[points.length - 1];

  return (
    <View>
      <ThemedText type="code" themeColor="textSecondary">max {format(max)}</ThemedText>
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} stroke={theme.border} strokeWidth={1} />
            <Polyline
              points={points.map((p) => `${x(p.t)},${y(p.value)}`).join(' ')}
              fill="none"
              stroke={theme.accent}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle cx={x(last.t)} cy={y(last.value)} r={4} fill={theme.accent} />
          </Svg>
        )}
      </View>
      <ThemedText type="code" themeColor="textSecondary">min {format(min)}</ThemedText>
      <View style={styles.axisRow}>
        <ThemedText type="code" themeColor="textSecondary">{timeFormat(t0)}</ThemedText>
        <ThemedText type="code" themeColor="textSecondary">{timeFormat(last.t)}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
