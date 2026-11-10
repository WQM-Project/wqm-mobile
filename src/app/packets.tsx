import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker, chosenDay } from '@/components/chip';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { exportReadings } from '@/lib/export';
import { bump } from '@/lib/haptics';
import { dateLabel, dayKey, dayLabel, readingDays } from '@/lib/metrics';
import type { Reading } from '@/lib/types';

const PAGE = 25;

export default function PacketsScreen() {
  const params = useLocalSearchParams<{ day?: string }>();
  const { data } = useReadings();
  const [shown, setShown] = useState(PAGE);
  const readings = data?.readings ?? [];
  const day = chosenDay(params.day, readingDays(readings));
  const inView = day ? readings.filter((r) => dayKey(r.recorded_at) === day) : readings;
  const newestFirst = [...inView].reverse();

  return (
    <Screen title="Packets" subtitle="Stored packets, newest first. Tap one to inspect it.">
      <DatePicker day={day} days={readingDays(readings)} onChange={(d) => router.setParams({ day: d })} />
      <ExportCard readings={inView} day={day} truncated={!day && !!data?.truncated} />
      {newestFirst.slice(0, shown).map((reading) => (
        <PacketRow key={reading.packet_id} reading={reading} />
      ))}
      {shown < newestFirst.length && (
        <Pressable onPress={() => setShown((n) => n + PAGE)} style={styles.more}>
          <ThemedText type="smallBold">Show more ({newestFirst.length - shown} left)</ThemedText>
        </Pressable>
      )}
    </Screen>
  );
}

// Save the packets in view as a CSV spreadsheet via the share sheet.
function ExportCard({ readings, day, truncated }: { readings: Reading[]; day?: string; truncated: boolean }) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    bump();
    setBusy(true);
    setMessage(null);
    try {
      await exportReadings(readings, day ? 'day' : 'all');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.exportText}>
          <ThemedText type="smallBold">{day ? `Export ${dayLabel(day, true)}` : 'Export all data'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {readings.length} {readings.length === 1 ? 'packet' : 'packets'} as a CSV spreadsheet. Save it to Files or
            Drive, or send it on.
          </ThemedText>
        </View>
        <Pressable
          onPress={run}
          disabled={busy || !readings.length}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.exportButton,
            { backgroundColor: theme.accent, opacity: !readings.length ? 0.4 : pressed ? 0.75 : 1 },
          ]}>
          {busy ? (
            <ActivityIndicator color={theme.background} />
          ) : (
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              Export
            </ThemedText>
          )}
        </Pressable>
      </View>
      {truncated && (
        <ThemedText type="small" themeColor="textSecondary">
          The app loads the newest 500 packets. The web dashboard has the full history.
        </ThemedText>
      )}
      {message && (
        <ThemedText type="small" style={{ color: theme.warning }}>
          {message}
        </ThemedText>
      )}
    </Card>
  );
}

function PacketRow({ reading }: { reading: Reading }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { payload } = reading;

  async function copyId() {
    await Clipboard.setStringAsync(reading.packet_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Pressable onPress={() => setOpen((o) => !o)} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <Card>
        <View style={styles.row}>
          <ThemedText type="smallBold">{dateLabel(reading.recorded_at)}</ThemedText>
          <ThemedText type="small" style={{ color: payload.gps_fix ? theme.accent : theme.textSecondary }}>
            {payload.gps_fix ? 'GPS' : 'No GPS'}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          pH {payload.pH.toFixed(2)} · {payload.temp_w1.toFixed(1)} °C · {payload.turb_ntu.toFixed(1)} NTU
        </ThemedText>
        {open && (
          <View style={styles.detail}>
            <Pressable onPress={copyId} style={styles.row} accessibilityLabel="Copy full packet UUID">
              <ThemedText type="code" themeColor="textSecondary">
                UUID {reading.packet_id.slice(0, 8)}…
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.accent }}>{copied ? 'Copied' : 'Copy'}</ThemedText>
            </Pressable>
            <View style={[styles.json, { backgroundColor: theme.background }]}>
              <ThemedText type="code">{JSON.stringify(payload, null, 2)}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              ts is node uptime in ms, not a calendar time.
            </ThemedText>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  detail: { gap: Spacing.two, marginTop: Spacing.one },
  json: { borderRadius: 10, padding: Spacing.three },
  more: { alignSelf: 'center', padding: Spacing.three },
  exportText: { flex: 1, gap: 2 },
  exportButton: {
    borderRadius: 999,
    paddingHorizontal: Spacing.four,
    height: 44,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
