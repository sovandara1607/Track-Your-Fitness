import { AuthProvider } from "@/lib/auth-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import 'react-native-url-polyfill/auto';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="new-workout" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[id]" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </ConvexProvider>
  );
}
