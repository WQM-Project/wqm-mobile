import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Small, consistent vibrations. Browsers have no haptics, so web is a no-op.
const on = Platform.OS !== 'web';

/** A light tick: chips, tabs, calendar days, chart scrubbing. */
export const tick = () => {
  if (on) void Haptics.selectionAsync();
};

/** A soft bump: zoom buttons, reset, refresh. */
export const bump = () => {
  if (on) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
