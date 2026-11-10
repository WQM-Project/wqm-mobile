import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { SOURCE_LABELS, setDataSource, useDataSource, type DataSource } from '@/lib/data-source';
import { bump, tick } from '@/lib/haptics';

// Scrollable page with a title, pull-to-refresh and shared loading/error states.
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const theme = useTheme();
  const { isPending, isRefetching, error, refetch } = useReadings();
  return (
    <View style={[styles.safe, { backgroundColor: theme.background }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                bump();
                void refetch();
              }}
              tintColor={theme.accent}
              colors={[theme.accent]}
            />
          }>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ThemedText type="subtitle" style={styles.title}>
                {title}
              </ThemedText>
              <SourceToggle />
            </View>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {isPending ? (
            <ActivityIndicator color={theme.accent} style={styles.state} />
          ) : error ? (
            <View style={styles.state}>
              <ThemedText type="smallBold">Readings could not be loaded</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {error.message}. Check the internet connection and pull down to retry.
              </ThemedText>
            </View>
          ) : (
            children
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Two-way switch between the simulated dataset and the real boat's packets.
function SourceToggle() {
  const theme = useTheme();
  const source = useDataSource();
  const pick = (next: DataSource) => {
    if (next === source) return;
    tick();
    setDataSource(next);
  };
  return (
    <View style={[styles.toggle, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {(Object.keys(SOURCE_LABELS) as DataSource[]).map((key) => {
        const active = key === source;
        return (
          <Pressable
            key={key}
            onPress={() => pick(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Show ${SOURCE_LABELS[key]} data`}
            style={[styles.toggleItem, active && { backgroundColor: theme.accent }]}>
            <ThemedText
              type="smallBold"
              style={{ color: active ? theme.background : theme.textSecondary, fontSize: 12 }}>
              {SOURCE_LABELS[key]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  title: { flexShrink: 1 },
  toggle: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 3 },
  toggleItem: { borderRadius: 999, paddingHorizontal: Spacing.two + 2, paddingVertical: 5 },
  safe: { flex: 1 },
  content: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  state: { marginTop: Spacing.five, gap: Spacing.two },
});
