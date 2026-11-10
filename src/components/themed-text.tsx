import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { ThemeColor, fontForWeight } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const flat: TextStyle =
    StyleSheet.flatten([{ color: theme[themeColor ?? 'text'] }, styles[type] as TextStyle, style]) ?? {};
  // Swap fontWeight for the matching Nunito file; Android cannot embolden a
  // custom font by weight alone.
  const { fontWeight, ...textStyle } = flat;
  return <Text style={[textStyle, { fontFamily: flat.fontFamily ?? fontForWeight(fontWeight) }]} {...rest} />;
}

const styles = StyleSheet.create({
  small: { fontSize: 14, lineHeight: 20, fontWeight: 500 },
  smallBold: { fontSize: 14, lineHeight: 20, fontWeight: 700 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 500 },
  title: { fontSize: 48, lineHeight: 54, fontWeight: 800 },
  subtitle: { fontSize: 32, lineHeight: 42, fontWeight: 800, letterSpacing: -0.5 },
  link: { lineHeight: 30, fontSize: 14 },
  linkPrimary: { lineHeight: 30, fontSize: 14, color: '#1a3a8a' },
  // Axis and chart labels: same family, even-width digits so times line up.
  code: { fontSize: 12, fontWeight: 600, fontVariant: ['tabular-nums'] },
});
