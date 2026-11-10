import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { BoatPosition, TrackPoint } from '@/lib/position';

// react-native-maps has no web support; the browser preview shows coordinates only.
export function BoatMap({ position }: { position?: BoatPosition; track?: TrackPoint[] }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText type="small" themeColor="textSecondary">
        Map preview is available in the Android app.
      </ThemedText>
      {position && (
        <ThemedText type="code">
          {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: 200, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 8 },
});
