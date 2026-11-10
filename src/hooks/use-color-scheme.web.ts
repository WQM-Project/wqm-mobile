// The app uses its light (white and navy) look everywhere, even when the phone
// is in dark mode. To follow the phone again, re-export useColorScheme from
// 'react-native' here and set "userInterfaceStyle": "automatic" in app.json.
export function useColorScheme(): 'light' | 'dark' {
  return 'light';
}
