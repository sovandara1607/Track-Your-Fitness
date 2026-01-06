

import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { borderRadius, spacing, typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, loading } = useAuth();
  const { colors, accentColor } = useSettings();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const error = isLogin 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      Alert.alert("Error", error);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleDemoMode = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
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
            <View style={[styles.logoContainer, { backgroundColor: accentColor + "20" }]}>
              <Ionicons name="barbell" size={64} color={accentColor} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.text }]}>TosLIFT</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Build Your Strongest Self</Text>
          </View>

          {/* Auth Toggle */}
          <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceLight }]}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && [styles.toggleButtonActive, { backgroundColor: colors.surface }]]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleText, { color: colors.textMuted }, isLogin && { color: colors.text }]}>
                Log In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && [styles.toggleButtonActive, { backgroundColor: colors.surface }]]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleText, { color: colors.textMuted }, !isLogin && { color: colors.text }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Auth Form */}
          <View style={styles.formSection}>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color={colors.textMuted} 
                />
              </TouchableOpacity>
            </View>

            <Button
              title={isLogin ? "Sign In" : "Sign Up"}
              onPress={handleAuth}
              loading={loading}
              style={styles.primaryButton}
            />

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.surfaceLight }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.surfaceLight }]} />
            </View>

            <Button
              title="Start in Demo Mode"
              onPress={handleDemoMode}
              loading={false}
              style={styles.demoButton}
              variant="secondary"
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  heroTitle: {
    ...typography.hero,
    letterSpacing: 8,
  },
  heroSubtitle: {
    ...typography.body,
    marginTop: spacing.sm,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {},
  toggleText: {
    ...typography.body,
    fontWeight: "500",
  },
  toggleTextActive: {},
  formSection: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
  },
  primaryButton: {
    marginTop: spacing.sm,
  },
  demoButton: {},
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
  },
});
