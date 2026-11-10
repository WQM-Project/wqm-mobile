import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { bump, tick } from '@/lib/haptics';

export type ChartPoint = { t: number; value: number };
type Range = { from: number; to: number };

const PAD_X = 4;
const PAD_TOP = 34; // room for the time label above the scrub line
const PAD_BOTTOM = 10;
const MIN_SPAN_MS = 5 * 60000; // never zoom in closer than 5 minutes
const TICKS = 4;

// Time-series chart in the style of a stock ticker:
// - a large value header that follows your finger,
// - drag with one finger to scrub, tap to inspect a point,
// - pinch (two fingers) to zoom and move, double-tap to reset.
// The value axis rescales to what is on screen. Change the `key` to reset zoom.
export function LineChart({
  points,
  height = 220,
  format,
  timeFormat,
  dateFormat,
}: {
  points: ChartPoint[];
  height?: number;
  format: (value: number) => string;
  timeFormat: (t: number) => string;
  dateFormat: (t: number) => string;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState<Range | null>(null);
  const [picked, setPicked] = useState<ChartPoint | null>(null);
  const pinchStart = useRef<{ view: Range; focalX: number } | null>(null);

  const full: Range = points.length ? { from: points[0].t, to: points[points.length - 1].t } : { from: 0, to: 1 };
  const fullSpan = Math.max(full.to - full.from, 1);
  const view = zoom ?? full;
  const span = Math.max(view.to - view.from, 1);
  const plotW = Math.max(width - PAD_X * 2, 1);

  // Keep a range inside the data and no narrower than MIN_SPAN_MS.
  const clamp = (from: number, to: number): Range | null => {
    const s = Math.min(Math.max(to - from, Math.min(MIN_SPAN_MS, fullSpan)), fullSpan);
    if (s >= fullSpan) return null; // fully zoomed out
    const f = Math.min(Math.max(from, full.from), full.to - s);
    return { from: f, to: f + s };
  };
  const timeAtX = (x: number, r: Range) => r.from + ((x - PAD_X) / plotW) * (r.to - r.from);
  const nearest = (t: number) => {
    let best: ChartPoint | null = null;
    for (const p of points) if (!best || Math.abs(p.t - t) < Math.abs(best.t - t)) best = p;
    return best;
  };

  // Zoom by `factor` keeping the time under `x` fixed (factor > 1 zooms in).
  const zoomBy = (factor: number, x = PAD_X + plotW / 2) => {
    const anchor = timeAtX(x, view);
    const s = span / factor;
    const left = anchor - ((x - PAD_X) / plotW) * s;
    setZoom(clamp(left, left + s));
  };

  const pinch = usePinchGesture({
    runOnJS: true,
    onActivate: (e) => {
      pinchStart.current = { view, focalX: e.focalX };
    },
    onUpdate: (e) => {
      const start = pinchStart.current;
      if (!start) return;
      // The time that was under the fingers stays under the fingers, so moving
      // both fingers sideways also pans.
      const anchor = timeAtX(start.focalX, start.view);
      const s = (start.view.to - start.view.from) / e.scale;
      const left = anchor - ((e.focalX - PAD_X) / plotW) * s;
      setZoom(clamp(left, left + s));
    },
  });
  const scrub = usePanGesture({
    runOnJS: true,
    maxPointers: 1,
    activeOffsetX: [-8, 8],
    failOffsetY: [-14, 14], // vertical drags still scroll the page
    onUpdate: (e) => {
      // A tick each time the cursor lands on a new reading, like a detent.
      const next = nearest(timeAtX(e.x, view));
      if (next && next.t !== picked?.t) tick();
      setPicked(next);
    },
    onDeactivate: () => setPicked(null),
  });
  const doubleTap = useTapGesture({
    runOnJS: true,
    numberOfTaps: 2,
    onDeactivate: (e) => {
      if (e.canceled) return;
      bump();
      setZoom(null);
      setPicked(null);
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    onDeactivate: (e) => {
      if (e.canceled) return;
      tick();
      setPicked((current) => (current ? null : nearest(timeAtX(e.x, view))));
    },
  });
  const gesture = useSimultaneousGestures(pinch, scrub, useExclusiveGestures(doubleTap, tap));

  if (points.length < 2)
    return (
      <ThemedText type="small" themeColor="textSecondary">
        Not enough readings in this window to draw a trend.
      </ThemedText>
    );

  // Visible points plus one either side, so the line runs to the edges.
  const firstIn = points.findIndex((p) => p.t >= view.from);
  const lastIn = points.findLastIndex((p) => p.t <= view.to);
  const visible = points.slice(Math.max(0, firstIn - 1), lastIn + 2);
  const inView = points.slice(firstIn, lastIn + 1);
  const values = (inView.length ? inView : visible).map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const vSpan = max - min || 1;

  const bottom = height - PAD_BOTTOM;
  const x = (t: number) => PAD_X + ((t - view.from) / span) * plotW;
  const y = (v: number) => PAD_TOP + (1 - (v - min) / vSpan) * (bottom - PAD_TOP);

  // Break the line where the boat went quiet instead of drawing a fake slope.
  const gaps = points.slice(1).map((p, i) => p.t - points[i].t).sort((a, b) => a - b);
  const breakAfter = Math.max(gaps[Math.floor(gaps.length / 2)] * 3, 10 * 60000);
  const segments: ChartPoint[][] = [];
  for (const p of visible) {
    const seg = segments[segments.length - 1];
    if (seg && p.t - seg[seg.length - 1].t <= breakAfter) seg.push(p);
    else segments.push([p]);
  }
  const linePath = (seg: ChartPoint[]) => seg.map((p, i) => `${i ? 'L' : 'M'}${x(p.t)},${y(p.value)}`).join(' ');
  const areaPath = (seg: ChartPoint[]) =>
    `${linePath(seg)} L${x(seg[seg.length - 1].t)},${bottom} L${x(seg[0].t)},${bottom} Z`;

  // Header: the scrubbed point, or the latest one, and its change across the view.
  const first = inView[0] ?? visible[0];
  const last = inView[inView.length - 1] ?? visible[visible.length - 1];
  const focus = picked ?? last;
  const change = focus.value - first.value;
  const pct = first.value ? (change / Math.abs(first.value)) * 100 : 0;
  const ticks = Array.from({ length: TICKS }, (_, i) => view.from + (span * i) / (TICKS - 1));

  const px = picked ? x(picked.t) : 0;
  const labelX = Math.min(Math.max(px, 60), width - 60);

  return (
    <View>
      <View style={styles.header}>
        <ThemedText style={styles.big}>{format(focus.value)}</ThemedText>
        {/* Change from the first reading on screen to the one shown above. A rise
            or fall is not good or bad by itself for water, so it stays neutral. */}
        <ThemedText type="small" themeColor="textSecondary">
          {change >= 0 ? '▲' : '▼'} {format(Math.abs(change))} ({Math.abs(pct).toFixed(1)}%) since{' '}
          {timeFormat(first.t)}
        </ThemedText>
      </View>

      <GestureDetector gesture={gesture}>
        <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
          {width > 0 && (
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.accent} stopOpacity={0.45} />
                  <Stop offset="1" stopColor={theme.accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {segments.map((seg, i) =>
                seg.length === 1 ? (
                  <Circle key={i} cx={x(seg[0].t)} cy={y(seg[0].value)} r={2.5} fill={theme.accent} />
                ) : (
                  <Path key={i} d={areaPath(seg)} fill="url(#fill)" />
                ),
              )}
              {segments.map((seg, i) =>
                seg.length > 1 ? (
                  <Path
                    key={`l${i}`}
                    d={linePath(seg)}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ) : null,
              )}
              {picked ? (
                <>
                  <Line x1={px} x2={px} y1={PAD_TOP - 8} y2={bottom} stroke={theme.text} strokeOpacity={0.5} strokeWidth={1} />
                  <SvgText x={labelX} y={16} fill={theme.text} fontSize={12} fontFamily={Fonts.semibold} textAnchor="middle">
                    {dateFormat(picked.t)}
                  </SvgText>
                  <Circle cx={px} cy={y(picked.value)} r={11} fill={theme.accent} fillOpacity={0.2} />
                  <Circle cx={px} cy={y(picked.value)} r={5} fill={theme.background} stroke={theme.accent} strokeWidth={2.5} />
                </>
              ) : (
                last.t >= view.from &&
                last.t <= view.to && (
                  <>
                    <Circle cx={x(last.t)} cy={y(last.value)} r={9} fill={theme.accent} fillOpacity={0.2} />
                    <Circle cx={x(last.t)} cy={y(last.value)} r={4} fill={theme.accent} />
                  </>
                )
              )}
            </Svg>
          )}
        </View>
      </GestureDetector>

      <View style={styles.axisRow}>
        {ticks.map((t) => (
          <ThemedText key={t} type="code" themeColor="textSecondary">
            {timeFormat(t)}
          </ThemedText>
        ))}
      </View>
      <View style={styles.controls}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {zoom ? 'Pinch to move, double-tap to reset' : 'Drag to read values, pinch to zoom'}
        </ThemedText>
        <ZoomButton label="−" disabled={!zoom} onPress={() => zoomBy(0.5)} />
        <ZoomButton label="+" disabled={span <= MIN_SPAN_MS} onPress={() => zoomBy(2)} />
        {zoom && <ZoomButton label="Reset" disabled={false} onPress={() => setZoom(null)} />}
      </View>
    </View>
  );
}

function ZoomButton({ label, disabled, onPress }: { label: string; disabled: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        bump();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Zoom in' : label === '−' ? 'Zoom out' : 'Reset zoom'}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}>
      <ThemedText type="smallBold">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 2, marginBottom: Spacing.one },
  big: { fontSize: 34, lineHeight: 40, fontWeight: 700 },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  hint: { flex: 1 },
  button: {
    borderRadius: 999,
    minWidth: 40,
    height: 34,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
