import type { ConfigContext, ExpoConfig } from 'expo/config';

// Everything lives in app.json; this file only adds the Google Maps key, which
// must stay out of git. Locally it comes from .env.local; on EAS cloud builds
// from the GOOGLE_MAPS_ANDROID_KEY environment variable (eas env:create).
// Expo Go ignores it: it ships its own key, so the map works there without one.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_KEY }],
  ],
});
