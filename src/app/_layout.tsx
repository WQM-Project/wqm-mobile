import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// One client for the whole app: every screen shares the same cached readings.
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30000 } },
});

// React Query can't see app focus on a phone by itself. Tell it, so the
// minute-by-minute refresh pauses in the background (saves battery and data)
// and catches up as soon as the app is opened again.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[scheme];
  // Keep the splash screen up until the fonts are ready (a fraction of a second).
  if (!fontsLoaded) return null;
  return (
    // Needed once at the root for the chart's pinch and pan gestures.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          value={{
            ...base,
            colors: {
              ...base.colors,
              background: colors.background,
              card: colors.background,
              text: colors.text,
              primary: colors.accent,
            },
          }}>
          <AppTabs />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
