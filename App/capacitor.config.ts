// capacitor.config.ts (Capacitor v6-compatible)
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.unitedpadel.app',
  appName: 'UnitedPadel',
  webDir: 'build',        // CRA outputs to "build"
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
