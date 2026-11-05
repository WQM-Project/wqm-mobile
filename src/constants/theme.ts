/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// WQM palette, matching the web dashboard: forest green on warm cream, turquoise accent.
export const Colors = {
  light: {
    text: '#1c2520',
    background: '#f7f6e8',
    backgroundElement: '#ecebdc',
    backgroundSelected: '#dfdecd',
    textSecondary: '#5d665f',
    accent: '#1f8f8a',
    warning: '#b4690e',
    border: '#d9d8c6',
  },
  dark: {
    text: '#f7f6e8',
    background: '#121612',
    backgroundElement: '#1d231e',
    backgroundSelected: '#29302a',
    textSecondary: '#a9b2aa',
    accent: '#2bb5b0',
    warning: '#e3a33c',
    border: '#2f3830',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
