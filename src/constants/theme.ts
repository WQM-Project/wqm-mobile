/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// WQM palette: deep navy on clean white, with a brighter blue for live data.
export const Colors = {
  light: {
    text: '#0b1b3f', // navy ink
    background: '#ffffff',
    backgroundElement: '#f1f4fa', // cards: a faint blue-white
    backgroundSelected: '#dde5f3',
    textSecondary: '#5a6785',
    accent: '#1a3a8a', // navy: lines, chips, active tabs
    warning: '#c2410c',
    border: '#dfe5f0',
  },
  dark: {
    text: '#f4f7fd',
    background: '#071330', // deep navy
    backgroundElement: '#0f1f45',
    backgroundSelected: '#1a2d5c',
    textSecondary: '#9fb0d3',
    accent: '#7ea6ff', // lighter blue so it reads on navy
    warning: '#fb923c',
    border: '#1f325f',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// Nunito: a rounded sans with friendly curved terminals and clear digits.
// Android picks a font file per weight, so each weight is its own family;
// ThemedText maps fontWeight to the right one. Loaded in app/_layout.tsx.
export const Fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_500Medium',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  mono: Platform.select({ ios: 'ui-monospace', default: 'monospace' }),
} as const;

export function fontForWeight(weight: string | number | undefined) {
  const w = Number(weight === 'bold' ? 700 : weight === 'normal' || weight == null ? 400 : weight);
  if (w >= 800) return Fonts.extrabold;
  if (w >= 700) return Fonts.bold;
  if (w >= 600) return Fonts.semibold;
  if (w >= 500) return Fonts.medium;
  return Fonts.regular;
}

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
