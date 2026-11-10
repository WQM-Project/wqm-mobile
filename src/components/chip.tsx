import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tick } from '@/lib/haptics';
import { dayKey, dayLabel } from '@/lib/metrics';

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
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

// A "YYYY-MM-DD" day key, as used in the ?day= route param.
export const isDayKey = (value: string | undefined): value is string => !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);

// The ?day= param, but only if this dataset has readings that day. After the
// Simulated / Field test switch, a day from the other dataset falls back to Latest.
export const chosenDay = (value: string | undefined, days: string[]) =>
  isDayKey(value) && days.includes(value) ? value : undefined;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const pad = (n: number) => String(n).padStart(2, '0');
type Month = { y: number; m: number }; // m is 0-11

// "Latest" or a day picked from a calendar. `day` undefined means Latest.
// `days` are the IST days that have readings; they get a dot.
export function DatePicker({
  day,
  days,
  onChange,
}: {
  day: string | undefined;
  days: string[];
  onChange: (day: string | undefined) => void;
}) {
  const [open, setOpen] = useState<{ month: Month; today: string } | null>(null);

  const show = () => {
    // Start on the chosen day's month, else the month of the newest reading.
    const today = dayKey(Date.now());
    const [y, m] = (day ?? days[0] ?? today).split('-').map(Number);
    setOpen({ month: { y, m: m - 1 }, today });
  };
  const pick = (key: string) => {
    tick();
    setOpen(null);
    onChange(key);
  };

  return (
    <View style={styles.row}>
      <Chip label="Latest" active={!day} onPress={() => onChange(undefined)} />
      <Chip label={day ? `${dayLabel(day, true)}  ▾` : 'Choose date  ▾'} active={!!day} onPress={show} />
      <Modal visible={!!open} transparent animationType="fade" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)}>
          {open && (
            <Calendar
              month={open.month}
              today={open.today}
              selected={day}
              withData={new Set(days)}
              onMonth={(month) => setOpen({ ...open, month })}
              onPick={pick}
              onClose={() => setOpen(null)}
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

function Calendar({
  month,
  today,
  selected,
  withData,
  onMonth,
  onPick,
  onClose,
}: {
  month: Month;
  today: string;
  selected: string | undefined;
  withData: Set<string>;
  onMonth: (month: Month) => void;
  onPick: (key: string) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { y, m } = month;
  const firstWeekday = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7) cells.push(null);

  const shift = (by: number) => {
    const d = new Date(Date.UTC(y, m + by, 1));
    onMonth({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };
  const monthKey = `${y}-${pad(m + 1)}`;
  const canGoNext = monthKey < today.slice(0, 7);
  const countThisMonth = [...withData].filter((k) => k.startsWith(monthKey)).length;

  return (
    // Swallow taps so pressing inside the sheet does not close it.
    <Pressable style={[styles.sheet, { backgroundColor: theme.background }]} onPress={() => {}}>
      <View style={styles.header}>
        <NavButton label="‹" onPress={() => shift(-1)} />
        <View style={styles.title}>
          <ThemedText type="smallBold">
            {MONTH_NAMES[m]} {y}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {countThisMonth ? `${countThisMonth} ${countThisMonth === 1 ? 'day' : 'days'} with readings` : 'No readings'}
          </ThemedText>
        </View>
        <NavButton label="›" disabled={!canGoNext} onPress={() => shift(1)} />
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((w, i) => (
          <View key={`w${i}`} style={styles.cell}>
            <ThemedText type="small" themeColor="textSecondary">{w}</ThemedText>
          </View>
        ))}
        {cells.map((d, i) => {
          if (!d) return <View key={`e${i}`} style={styles.cell} />;
          const key = `${monthKey}-${pad(d)}`;
          const hasData = withData.has(key);
          const isSelected = key === selected;
          const isToday = key === today;
          return (
            <Pressable
              key={key}
              disabled={!hasData}
              onPress={() => onPick(key)}
              accessibilityRole="button"
              accessibilityLabel={`${dayLabel(key, true)}${hasData ? ', has readings' : ', no readings'}`}
              accessibilityState={{ selected: isSelected, disabled: !hasData }}
              style={styles.cell}>
              <View
                style={[
                  styles.day,
                  isSelected && { backgroundColor: theme.accent },
                  !isSelected && isToday && { borderWidth: 1, borderColor: theme.accent },
                ]}>
                <ThemedText
                  type={hasData ? 'smallBold' : 'small'}
                  style={{
                    color: isSelected ? theme.background : hasData ? theme.text : theme.textSecondary,
                    opacity: hasData || isSelected ? 1 : 0.45,
                  }}>
                  {d}
                </ThemedText>
              </View>
              <View style={[styles.dot, { backgroundColor: hasData ? theme.accent : 'transparent' }]} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.legend}>
          <View style={[styles.dot, { backgroundColor: theme.accent }]} />
          <ThemedText type="small" themeColor="textSecondary">Readings available</ThemedText>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Close</ThemedText>
        </Pressable>
      </View>
    </Pressable>
  );
}

function NavButton({ label, disabled, onPress }: { label: string; disabled?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === '‹' ? 'Previous month' : 'Next month'}
      style={({ pressed }) => [
        styles.nav,
        { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 },
      ]}>
      <ThemedText style={styles.navText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: Spacing.three,
  },
  sheet: { borderRadius: 24, padding: Spacing.three, gap: Spacing.three, maxWidth: 420, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { alignItems: 'center', gap: 2 },
  nav: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 22, lineHeight: 26, fontWeight: 600 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4, gap: 3 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
