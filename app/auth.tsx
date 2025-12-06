

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, borderRadius, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/Button";
import * as Haptics from "expo-haptics";

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
      } else {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          if (result.error.code === "INVALID_EMAIL_OR_PASSWORD") {
            setError("Invalid email or password. Try signing up instead?");
          } else {
            setError(result.error.message || "Sign in failed");
          }
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await authClient.signIn.social({ provider: "google" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Google sign in failed";
      setError(errorMessage);
      setGoogleLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setAnonymousLoading(true);
    setError("");
    try {
      await authClient.signIn.anonymous();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Anonymous sign in failed";
      setError(errorMessage);
      setAnonymousLoading(false);
    }
  };

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
            <Text style={styles.heroTitle}>FORGE</Text>
            <Text style={styles.heroSubtitle}>Build Your Strongest Self</Text>
          </View>

          {/* Auth Form */}
          <View style={styles.formSection}>
            {mode === "signup" && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

  
          <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={mode === "signin" ? "Sign In" : "Create Account"}
              onPress={handleEmailAuth}
              loading={loading}
              style={styles.primaryButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={colors.text} />
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.anonymousButton]}
              onPress={handleAnonymousSignIn
}
              disabled={anonymousLoading}
            >
              {anonymousLoading ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={20} color={colors.primary} />
                  <Text style={[styles.socialButtonText, { color: colors.primary }]}>
                    Try Without Account
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchMode}
              onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              <Text style={styles.switchModeText}>
                {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                <Text style={styles.switchModeLink}>
                  {mode === "signin" ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </TouchableOpacity>
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.surfaceLight,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
    marginHorizontal: spacing.md,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  anonymousButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  socialButtonText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
  },
  switchMode: {
    marginTop: spacing.lg,
    alignItems: "center",
  },
  switchModeText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  switchModeLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
