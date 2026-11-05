import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

const TABS = [
  { name: 'index', label: 'Overview', md: 'water_drop', sf: 'drop' },
  { name: 'trends', label: 'Trends', md: 'show_chart', sf: 'chart.xyaxis.line' },
  { name: 'map', label: 'Map', md: 'map', sf: 'map' },
  { name: 'packets', label: 'Packets', md: 'list_alt', sf: 'list.bullet.rectangle' },
] as const;

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundSelected}
      labelStyle={{ selected: { color: colors.text } }}>
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={tab.md} sf={tab.sf} selectedColor={colors.accent} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
