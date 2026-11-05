import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';

// Scrollable page with a title, pull-to-refresh and shared loading/error states.
export function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const theme = useTheme();
  const { isPending, isRefetching, error, refetch } = useReadings();
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }>
        <View style={styles.header}>
          <ThemedText type="subtitle">{title}</ThemedText>
          {subtitle ? <ThemedText type="small" themeColor="textSecondary">{subtitle}</ThemedText> : null}
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
  );
}

const styles = StyleSheet.create({
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
