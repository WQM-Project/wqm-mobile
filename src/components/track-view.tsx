import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { bearing, type BoatPosition, type TrackPoint } from '@/lib/position';

const HEIGHT = 320;
const PAD = 28;

// The boat's GPS path drawn to scale, with no map service or API key:
// points become metres east/north of the track's centre, fitted into the box
// without stretching, over a grid with a north arrow and a scale bar.
// The interactive satellite map lives on the web dashboard.
export function TrackView({ position, track }: { position?: BoatPosition; track: TrackPoint[] }) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const points = track.length ? track : position ? [{ ...position, t: 0 }] : [];
  if (!points.length)
    return (
      <View style={[styles.box, styles.empty, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="small" themeColor="textSecondary">
          No GPS position yet for this period.
        </ThemedText>
      </View>
    );

  // Local flat-earth projection, accurate to well under a metre over a few km.
  const lat0 = points.reduce((s, p) => s + p.latitude, 0) / points.length;
  const lon0 = points.reduce((s, p) => s + p.longitude, 0) / points.length;
  const mPerLat = 111320;
  const mPerLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const xy = points.map((p) => ({ e: (p.longitude - lon0) * mPerLon, n: (p.latitude - lat0) * mPerLat }));
  const es = xy.map((p) => p.e);
  const ns = xy.map((p) => p.n);
  const spanE = Math.max(Math.max(...es) - Math.min(...es), 20); // at least 20 m across
  const spanN = Math.max(Math.max(...ns) - Math.min(...ns), 20);
  const midE = (Math.max(...es) + Math.min(...es)) / 2;
  const midN = (Math.max(...ns) + Math.min(...ns)) / 2;
  const innerW = Math.max(width - PAD * 2, 1);
  const innerH = HEIGHT - PAD * 2;
  const k = Math.min(innerW / spanE, innerH / spanN); // pixels per metre, same both ways
  const sx = (e: number) => width / 2 + (e - midE) * k;
  const sy = (n: number) => HEIGHT / 2 - (n - midN) * k;

  // Scale bar: a round number of metres about a quarter of the width.
  const target = innerW / 4 / k;
  const mag = 10 ** Math.floor(Math.log10(target));
  const metres = [1, 2, 5, 10]
    .map((m) => m * mag)
    .reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a));
  const barPx = metres * k;
  const grid = barPx; // one grid square = one scale-bar length

  const d = xy.map((p, i) => `${i ? 'L' : 'M'}${sx(p.e).toFixed(1)},${sy(p.n).toFixed(1)}`).join(' ');
  const last = xy[xy.length - 1];
  const heading = track.length > 1 ? bearing(track[track.length - 2], track[track.length - 1]) : 0;
  const bx = sx(last.e);
  const by = sy(last.n);

  const gridLines = [];
  if (width > 0 && grid > 8) {
    for (let x = width / 2 - Math.ceil(width / 2 / grid) * grid; x <= width; x += grid)
      gridLines.push(<Line key={`x${x}`} x1={x} x2={x} y1={0} y2={HEIGHT} stroke={theme.border} strokeWidth={1} />);
    for (let y = HEIGHT / 2 - Math.ceil(HEIGHT / 2 / grid) * grid; y <= HEIGHT; y += grid)
      gridLines.push(<Line key={`y${y}`} x1={0} x2={width} y1={y} y2={y} stroke={theme.border} strokeWidth={1} />);
  }
  const label = metres >= 1000 ? `${metres / 1000} km` : `${metres} m`;

  return (
    <View onLayout={onLayout} style={[styles.box, { backgroundColor: theme.backgroundElement }]}>
      {width > 0 && (
        <Svg width={width} height={HEIGHT}>
          <Rect x={0} y={0} width={width} height={HEIGHT} fill={theme.backgroundElement} />
          {gridLines}
          {xy.length > 1 && (
            <>
              <Path d={d} fill="none" stroke="#ffffff" strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
              <Path
                d={d}
                fill="none"
                stroke={theme.accent}
                strokeWidth={3.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle cx={sx(xy[0].e)} cy={sy(xy[0].n)} r={6} fill="#ffffff" stroke={theme.accent} strokeWidth={3} />
            </>
          )}
          {/* Boat: navy disc with a white ring and a white arrow pointing along its heading. */}
          <G transform={`translate(${bx} ${by}) rotate(${heading})`}>
            <Circle r={15} fill={theme.accent} stroke="#ffffff" strokeWidth={3} />
            <Polygon points="0,-9 6,6 0,3 -6,6" fill="#ffffff" />
          </G>
          {/* North arrow */}
          <G transform={`translate(${width - 22} 26)`}>
            <Polygon points="0,-12 6,6 0,2 -6,6" fill={theme.text} />
            <SvgText y={20} fontSize={11} fontFamily={Fonts.bold} fill={theme.text} textAnchor="middle">
              N
            </SvgText>
          </G>
          {/* Scale bar */}
          <G transform={`translate(14 ${HEIGHT - 16})`}>
            <Line x1={0} x2={barPx} y1={0} y2={0} stroke={theme.text} strokeWidth={2.5} />
            <Line x1={0} x2={0} y1={-5} y2={0} stroke={theme.text} strokeWidth={2.5} />
            <Line x1={barPx} x2={barPx} y1={-5} y2={0} stroke={theme.text} strokeWidth={2.5} />
            <SvgText x={barPx + 6} y={4} fontSize={11} fontFamily={Fonts.bold} fill={theme.text}>
              {label}
            </SvgText>
          </G>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: HEIGHT, borderRadius: 20, overflow: 'hidden' },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 16 },
});
