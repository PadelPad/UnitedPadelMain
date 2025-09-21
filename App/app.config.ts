import 'dotenv/config';

export default {
  expo: {
    name: "United Padel",
    slug: "united-padel",
    scheme: "unitedpadel",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./resources/icon.png",
    splash: { image: "./resources/splash.png", resizeMode: "contain", backgroundColor: "#000000" },
    runtimeVersion: { policy: "appVersion" },
    updates: { fallbackToCacheTimeout: 0 },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.unitedpadel.app",
      infoPlist: { UIStatusBarStyle: "UIStatusBarStyleLightContent" },
      associatedDomains: ["applinks:app.unitedpadel.co.uk"]
    },
    android: {
      package: "com.unitedpadel.app",
      intentFilters: [{
        action: "VIEW",
        data: [{ scheme: "https", host: "app.unitedpadel.co.uk" }, { scheme: "unitedpadel", host: "auth-callback" }],
        category: ["BROWSABLE","DEFAULT"]
      }]
    },
    plugins: ["expo-router", "expo-notifications", ["nativewind/babel", {}]],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
