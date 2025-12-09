

import { Button } from "@/components/Button";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="fitness" size={64} color={colors.primary} />
            </View>
            <Text style={styles.heroTitle}>LIFT</Text>
            <Text style={styles.heroSubtitle}>Build Your Strongest Self</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formSection}>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={styles.infoText}>
                Authentication is coming soon. For now, you can explore the app in demo mode.
                Because the developer is lazy and didn't want to set up backend services.
              </Text>
            </View>

            <Button
              title="Enter Demo Mode"
              onPress={() => router.replace("/(tabs)")}
              loading={false}
              style={styles.primaryButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.hero,
    color: colors.text,
    letterSpacing: 8,
  },
  heroSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  formSection: {
    flex: 1,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "15",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    lineHeight: 20,
  },
});
