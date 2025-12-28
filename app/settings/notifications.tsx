import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, typography } from "@/constants/theme";
import {
  cancelAllNotifications,
  requestNotificationPermissions,
  scheduleWorkoutReminder
} from "@/lib/notifications";
import { useSettings } from "@/lib/settings-context";
import { NotificationSettings } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationSetting = {
  id: keyof NotificationSettings;
  title: string;
  description: string;
};

const notificationOptions: NotificationSetting[] = [
  {
    id: "workout_reminders",
    title: "Workout Reminders",
    description: "Get reminded to complete your daily workout",
  },
  {
    id: "streak_alerts",
    title: "Streak Alerts",
    description: "Notifications when your streak is at risk",
  },
  {
    id: "achievements",
    title: "Achievement Notifications",
    description: "Celebrate when you hit milestones",
  },
  {
    id: "weekly_summary",
    title: "Weekly Summary",
    description: "Get a summary of your weekly progress",
  },
  {
    id: "rest_day",
    title: "Rest Day Reminders",
    description: "Reminders to take rest days for recovery",
  },
];

export default function NotificationsScreen() {
  const { notifications, updateNotifications, colors, accentColor } = useSettings();
  const [permissionGranted, setPermissionGranted] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
  };

  const toggleSetting = async (id: keyof NotificationSettings) => {
    const newValue = !notifications[id];
    await updateNotifications({ [id]: newValue });

    // Handle workout reminders scheduling
    if (id === "workout_reminders") {
      if (newValue) {
        try {
          await scheduleWorkoutReminder(18, 0); // 6 PM daily reminder
        } catch (error) {
          console.log("Failed to schedule reminder:", error);
        }
      } else {
        // Cancel scheduled reminders when disabled
        await cancelAllNotifications();
      }
    }
  };

  const toggleAll = async (value: boolean) => {
    await updateNotifications({
      workout_reminders: value,
      streak_alerts: value,
      achievements: value,
      weekly_summary: value,
      rest_day: value,
    });

    if (!value) {
      await cancelAllNotifications();
    }
  };

  const handleTestNotification = async () => {
    const { sendWorkoutCompletedNotification } = await import("@/lib/notifications");
    try {
      await sendWorkoutCompletedNotification("Test Workout");
      Alert.alert("Notification Sent", "Check your notification center!");
    } catch {
      Alert.alert("Error", "Failed to send test notification");
    }
  };

  const hasAnyEnabled = Object.values(notifications).some((v) => v);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Warning */}
        {!permissionGranted && (
          <TouchableOpacity 
            style={[styles.warningBox, { backgroundColor: "#FFA50020", borderColor: "#FFA500" }]}
            onPress={checkPermissions}
          >
            <Ionicons name="warning" size={20} color="#FFA500" />
            <Text style={[styles.warningText, { color: "#FFA500" }]}>
              Notifications are disabled. Tap to enable in settings.
            </Text>
          </TouchableOpacity>
        )}

        {/* Master Toggle */}
        <View style={[styles.masterToggle, { backgroundColor: colors.surface }]}>
          <View style={styles.masterToggleText}>
            <Text style={[styles.masterTitle, { color: colors.text }]}>Push Notifications</Text>
            <Text style={[styles.masterDescription, { color: colors.textSecondary }]}>
              Enable or disable all notifications
            </Text>
          </View>
          <Switch
            value={hasAnyEnabled}
            onValueChange={toggleAll}
            trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
            thumbColor={hasAnyEnabled ? accentColor : colors.textMuted}
          />
        </View>

        {/* Test Notification Button */}
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: accentColor }]}
          onPress={handleTestNotification}
        >
          <Ionicons name="notifications" size={20} color="#FFFFFF" />
          <Text style={styles.testButtonText}>Send Test Notification</Text>
        </TouchableOpacity>

        {/* Individual Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Types</Text>
          {notificationOptions.map((option) => (
            <View key={option.id} style={[styles.settingItem, { backgroundColor: colors.surface }]}>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{option.description}</Text>
              </View>
              <Switch
                value={notifications[option.id]}
                onValueChange={() => toggleSetting(option.id)}
                trackColor={{ false: colors.surfaceLight, true: accentColor + "50" }}
                thumbColor={notifications[option.id] ? accentColor : colors.textMuted}
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceLight }]}>
          <Ionicons name="information-circle" size={20} color={colors.textMuted} />
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            Notification settings are stored locally on your device. Make sure notifications are enabled in your device settings.
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
  masterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  masterToggleText: {
    flex: 1,
    marginRight: spacing.md,
  },
  masterTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  masterDescription: {
    ...typography.caption,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  settingText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingTitle: {
    ...typography.body,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
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
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  warningText: {
    ...typography.body,
    flex: 1,
    fontWeight: "500",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  testButtonText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
