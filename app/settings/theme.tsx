import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ThemeOption = "light" | "dark" | "system";

type AccentColor = {
  id: string;
  name: string;
  color: string;
};

export default function ThemeScreen() {
  const { theme, updateTheme, colors, accentColor } = useSettings();

  const handleThemeChange = async (newTheme: ThemeOption) => {
    await updateTheme({ theme: newTheme });
  };

  const handleAccentChange = async (accent: string) => {
    await updateTheme({ accentColor: accent });
  };

  const themeOptions: { id: ThemeOption; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: "light", title: "Light", icon: "sunny" },
    { id: "dark", title: "Dark", icon: "moon" },
    { id: "system", title: "System", icon: "phone-portrait" },
  ];

  const accentColors: AccentColor[] = [
    { id: "blue", name: "Blue", color: "#3B82F6" },
    { id: "green", name: "Green", color: "#10B981" },
    { id: "purple", name: "Purple", color: "#8B5CF6" },
    { id: "orange", name: "Orange", color: "#F59E0B" },
    { id: "pink", name: "Pink", color: "#EC4899" },
    { id: "teal", name: "Teal", color: "#14B8A6" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={styles.themeGrid}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.themeOption,
                  { backgroundColor: colors.surface },
                  theme.theme === option.id && [styles.themeOptionSelected, { borderColor: accentColor }],
                ]}
                onPress={() => handleThemeChange(option.id)}
              >
                <View
                  style={[
                    styles.themeIconContainer,
                    { backgroundColor: colors.surfaceLight },
                    theme.theme === option.id && { backgroundColor: accentColor + "20" },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={theme.theme === option.id ? accentColor : colors.textSecondary}
                  />
                </View>
                <Text
                  style={[
                    styles.themeOptionText,
                    { color: colors.textSecondary },
                    theme.theme === option.id && { color: colors.text },
                  ]}
                >
                  {option.title}
                </Text>
                {theme.theme === option.id && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color={accentColor} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accent Color */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Accent Color</Text>
          <View style={styles.colorGrid}>
            {accentColors.map((accent) => (
              <TouchableOpacity
                key={accent.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: colors.surface },
                  theme.accentColor === accent.id && [styles.colorOptionSelected, { borderColor: accent.color }],
                ]}
                onPress={() => handleAccentChange(accent.id)}
              >
                <View style={[styles.colorCircle, { backgroundColor: accent.color }]}>
                  {theme.accentColor === accent.id && (
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.colorName, { color: colors.textSecondary }]}>{accent.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <View style={styles.previewHeader}>
              <View style={[styles.previewIcon, { backgroundColor: accentColors.find(c => c.id === theme.accentColor)?.color }]}>
                <Ionicons name="fitness" size={24} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.previewTitle, { color: colors.text }]}>Today's Workout</Text>
                <Text style={[styles.previewSubtitle, { color: colors.textSecondary }]}>Upper Body Strength</Text>
              </View>
            </View>
            <View style={styles.previewStats}>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatValue, { color: accentColors.find(c => c.id === theme.accentColor)?.color }]}>45</Text>
                <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>Minutes</Text>
              </View>
              <View style={styles.previewStat}>
                <Text style={[styles.previewStatValue, { color: accentColors.find(c => c.id === theme.accentColor)?.color }]}>6</Text>
                <Text style={[styles.previewStatLabel, { color: colors.textSecondary }]}>Exercises</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Theme preferences are saved locally. Some changes may require restarting the app to take full effect.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  themeGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  themeOption: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  themeOptionSelected: {},
  themeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  themeIconContainerSelected: {},
  themeOptionText: {
    ...typography.caption,
    fontWeight: "500",
  },
  themeOptionTextSelected: {},
  checkmark: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  colorOption: {
    width: "30%",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {},
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  colorName: {
    ...typography.caption,
  },
  previewCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  previewTitle: {
    ...typography.body,
    fontWeight: "600",
  },
  previewSubtitle: {
    ...typography.caption,
  },
  previewStats: {
    flexDirection: "row",
    gap: spacing.xl,
  },
  previewStat: {
    alignItems: "center",
  },
  previewStatValue: {
    ...typography.h2,
  },
  previewStatLabel: {
    ...typography.caption,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
  },
});
