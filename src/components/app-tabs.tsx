import { NativeTabs } from 'expo-router/native-tabs';

import { Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TABS = [
  { name: 'index', label: 'Overview', md: 'water_drop', sf: 'drop' },
  { name: 'trends', label: 'Trends', md: 'show_chart', sf: 'chart.xyaxis.line' },
  { name: 'map', label: 'Map', md: 'map', sf: 'map' },
  { name: 'packets', label: 'Packets', md: 'list_alt', sf: 'list.bullet.rectangle' },
] as const;

// A navy bar floating over the white app, with a frosted white pill behind the
// active tab. Android's native bar cannot blur what is behind it, so the glass
// is a translucent white layer on the navy rather than a real blur. iOS gets
// the system material.
const BAR = { light: '#0b1b3f', dark: '#0f1f45' };
const WHITE = '#ffffff';
const WHITE_DIM = 'rgba(255,255,255,0.62)';
const GLASS = 'rgba(255,255,255,0.18)';

export default function AppTabs() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <NativeTabs
      backgroundColor={BAR[scheme]}
      blurEffect="systemChromeMaterialDark"
      indicatorColor={GLASS}
      rippleColor={GLASS}
      iconColor={{ default: WHITE_DIM, selected: WHITE }}
      labelStyle={{
        default: { color: WHITE_DIM, fontFamily: Fonts.semibold, fontSize: 12 },
        selected: { color: WHITE, fontFamily: Fonts.bold, fontSize: 12 },
      }}
      labelVisibilityMode="labeled">
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.name} name={tab.name}>
          <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon md={tab.md} sf={tab.sf} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
