import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query/client";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { LoadingOverlayProvider, LoadingOverlay } from "@/lib/ui/loading";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LoadingOverlayProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }} />
          <LoadingOverlay />
        </QueryClientProvider>
      </LoadingOverlayProvider>
    </GestureHandlerRootView>
  );
}
