import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { PreferencesSettings } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PreferencesScreen() {
  const { preferences, updatePreferences, colors, accentColor } = useSettings();

  const updateSetting = async <K extends keyof PreferencesSettings>(
    key: K,
    value: PreferencesSettings[K]
  ) => {
    await updatePreferences({ [key]: value });
  };

  const restTimeOptions = [30, 60, 90, 120, 180];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Preferences</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Units */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Units</Text>
          
          <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Weight Unit</Text>
            <View style={[styles.toggleGroup, { backgroundColor: colors.surfaceLight }]}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.weightUnit === "kg" && { backgroundColor: accentColor },
                ]}
                onPress={() => updateSetting("weightUnit", "kg")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    preferences.weightUnit === "kg" && styles.toggleTextSelected,
                  ]}
                >
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.weightUnit === "lbs" && { backgroundColor: accentColor },
                ]}
                onPress={() => updateSetting("weightUnit", "lbs")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    preferences.weightUnit === "lbs" && styles.toggleTextSelected,
                  ]}
                >
                  lbs
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.settingRow, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Distance Unit</Text>
            <View style={[styles.toggleGroup, { backgroundColor: colors.surfaceLight }]}>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.distanceUnit === "km" && { backgroundColor: accentColor },
                ]}
                onPress={() => updateSetting("distanceUnit", "km")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    preferences.distanceUnit === "km" && styles.toggleTextSelected,
                  ]}
                >
                  km
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleOption,
                  preferences.distanceUnit === "mi" && { backgroundColor: accentColor },
                ]}
                onPress={() => updateSetting("distanceUnit", "mi")}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    preferences.distanceUnit === "mi" && styles.toggleTextSelected,
                  ]}
                >
                  mi
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Timer Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rest Timer</Text>
          
          <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
            <View style={styles.switchText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Show Rest Timer</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Display rest timer between sets
              </Text>
            </View>
            <Switch
              value={preferences.showRestTimer}
              onValueChange={(value) => updateSetting("showRestTimer", value)}
              trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
              thumbColor={preferences.showRestTimer ? accentColor : colors.textMuted}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
            <View style={styles.switchText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Auto-Start Timer</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Automatically start timer after completing a set
              </Text>
            </View>
            <Switch
              value={preferences.autoStartTimer}
              onValueChange={(value) => updateSetting("autoStartTimer", value)}
              trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
              thumbColor={preferences.autoStartTimer ? accentColor : colors.textMuted}
            />
          </View>

          <View style={[styles.restTimeSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Default Rest Time</Text>
            <View style={styles.restTimeGrid}>
              {restTimeOptions.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.restTimeOption,
                    { backgroundColor: colors.surfaceLight },
                    preferences.defaultRestTime === time && { borderColor: accentColor, backgroundColor: accentColor + "20" },
                  ]}
                  onPress={() => updateSetting("defaultRestTime", time)}
                >
                  <Text
                    style={[
                      styles.restTimeText,
                      { color: colors.textSecondary },
                      preferences.defaultRestTime === time && { color: accentColor },
                    ]}
                  >
                    {time >= 60 ? `${Math.floor(time / 60)}:${(time % 60).toString().padStart(2, '0')}` : `0:${time}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* App Behavior */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Behavior</Text>
          
          <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
            <View style={styles.switchText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Haptic Feedback</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Vibration feedback for actions
              </Text>
            </View>
            <Switch
              value={preferences.hapticFeedback}
              onValueChange={(value) => updateSetting("hapticFeedback", value)}
              trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
              thumbColor={preferences.hapticFeedback ? accentColor : colors.textMuted}
            />
          </View>

          <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
            <View style={styles.switchText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Keep Screen On</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Prevent screen from sleeping during workouts
              </Text>
            </View>
            <Switch
              value={preferences.keepScreenOn}
              onValueChange={(value) => updateSetting("keepScreenOn", value)}
              trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
              thumbColor={preferences.keepScreenOn ? accentColor : colors.textMuted}
            />
          </View>
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Preferences are saved automatically and stored locally on your device.
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: "500",
  },
  settingDescription: {
    ...typography.caption,
    marginTop: 2,
  },
  toggleGroup: {
    flexDirection: "row",
    borderRadius: borderRadius.md,
    padding: 4,
  },
  toggleOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  toggleText: {
    ...typography.caption,
    fontWeight: "600",
  },
  toggleTextSelected: {
    color: "#FFFFFF",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  switchText: {
    flex: 1,
    marginRight: spacing.md,
  },
  restTimeSection: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  restTimeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  restTimeOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  restTimeText: {
    ...typography.body,
    fontWeight: "500",
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
