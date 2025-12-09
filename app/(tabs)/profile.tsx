import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const stats = useQuery(api.workouts.getStats);
  const recentWorkouts = useQuery(api.workouts.getRecent, { limit: 5 });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={styles.name}>smos</Text>
          <Text style={styles.email}>smos@lift.app</Text>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="barbell" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{stats?.totalWorkouts ?? 0}</Text>
              <Text style={styles.statLabel}>Total Workouts</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{stats?.totalMinutes ?? 0}</Text>
              <Text style={styles.statLabel}>Total Minutes</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="flame" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{stats?.currentStreak ?? 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={32} color={colors.primary} />
              <Text style={styles.statValue}>
                {recentWorkouts?.filter((w) => w.completed).length ?? 0}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="color-palette" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={24} color={colors.text} />
              <Text style={styles.menuItemText}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, styles.dangerItem]}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out" size={24} color={colors.error} />
              <Text style={[styles.menuItemText, styles.dangerText]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>LIFT v1.0.0</Text>
          <Text style={styles.versionSubtext}>Demo Mode</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    color: colors.text,
    fontWeight: "500",
  },
  dangerItem: {
    backgroundColor: colors.error + "15",
  },
  dangerText: {
    color: colors.error,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: "600",
  },
  versionSubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
