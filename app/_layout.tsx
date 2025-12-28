import { AuthProvider } from "@/lib/auth-context";
import { requestNotificationPermissions } from "@/lib/notifications";
import { SettingsProvider } from "@/lib/settings-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { useEffect } from "react";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  // Request notification permissions on app start
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <SettingsProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="new-workout" />
            <Stack.Screen name="workout/[id]" />
            <Stack.Screen name="settings/notifications" />
            <Stack.Screen name="settings/theme" />
            <Stack.Screen name="settings/preferences" />
            <Stack.Screen name="settings/help" />
            <Stack.Screen name="settings/about" />
          </Stack>
        </SettingsProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}
