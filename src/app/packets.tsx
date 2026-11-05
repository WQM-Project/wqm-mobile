import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { dateLabel } from '@/lib/metrics';
import type { Reading } from '@/lib/types';

const PAGE = 25;

export default function PacketsScreen() {
  const { data } = useReadings();
  const [shown, setShown] = useState(PAGE);
  const newestFirst = [...(data?.readings ?? [])].reverse();

  return (
    <Screen title="Packets" subtitle="Stored packets, newest first. Tap one to inspect it.">
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
});
