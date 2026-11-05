import { Linking, Pressable } from 'react-native';

import { BoatMap } from '@/components/boat-map';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useReadings } from '@/lib/api';
import { agoLabel, dateLabel } from '@/lib/metrics';
import { isStale, latestBoatPosition } from '@/lib/position';

export default function MapScreen() {
  const theme = useTheme();
  const { data } = useReadings();
  const position = latestBoatPosition(data?.readings ?? []);

  return (
    <Screen title="Boat location" subtitle={position ? 'Latest GPS position from the gateway' : 'GPS pending'}>
      <BoatMap position={position} />
      <Card>
        {position ? (
          <>
            <ThemedText type="smallBold">
              {coordinate(position.latitude, 'N', 'S')}, {coordinate(position.longitude, 'E', 'W')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Packet received {dateLabel(position.recordedAt)} ({agoLabel(position.recordedAt)}).
            </ThemedText>
            {isStale(position) && (
              <ThemedText type="small" style={{ color: theme.warning }}>
                Position was {Math.round((position.fixAgeSeconds ?? 0) / 60)} min old when sent; the boat may have moved.
              </ThemedText>
            )}
            <Pressable
              accessibilityRole="link"
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${position.latitude},${position.longitude}`)}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>Open in Google Maps</ThemedText>
            </Pressable>
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No packet has a GPS position yet. The map shows the IIT Mandi North Campus reference until the gateway
            reports a settled fix.
          </ThemedText>
        )}
      </Card>
    </Screen>
  );
}

const coordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value).toFixed(6)}° ${value >= 0 ? positive : negative}`;
