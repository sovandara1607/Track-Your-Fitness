import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { colors, accentColor } = useSettings();
  const stats = useQuery(api.workouts.getStats, user ? { userId: user.id } : "skip");
  const recentWorkouts = useQuery(api.workouts.getRecent, user ? { userId: user.id, limit: 5 } : "skip");
  const profile = useQuery(
    api.profile.getProfile,
    user ? { userId: user.id as Id<"users"> } : "skip"
  );

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/auth");
          },
        },
      ]
    );
  };

  const handleNavigate = (route: "/settings/notifications" | "/settings/theme" | "/settings/preferences" | "/settings/help" | "/settings/about" | "/settings/edit-profile") => {
    router.push(route);
  };

  const displayName = profile?.displayName || profile?.name || user?.name || "User";
  const userEmail = profile?.email || user?.email || "";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.profileImageContainer, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/edit-profile")}
          >
            {profile?.profileImageUrl ? (
              <Image
                source={{ uri: profile.profileImageUrl }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person" size={48} color={accentColor} />
            )}
            <View style={[styles.editBadge, { backgroundColor: accentColor }]}>
              <Ionicons name="pencil" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{userEmail}</Text>
          {profile?.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
              {profile.bio}
            </Text>
          )}
          {profile?.fitnessGoal && (
            <View style={[styles.goalBadge, { backgroundColor: accentColor + "20" }]}>
              <Ionicons name="fitness" size={14} color={accentColor} />
              <Text style={[styles.goalText, { color: accentColor }]}>
                {profile.fitnessGoal}
              </Text>
            </View>
          )}
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={[styles.editProfileButton, { backgroundColor: colors.surface }]}
          onPress={() => handleNavigate("/settings/edit-profile")}
        >
          <Ionicons name="create-outline" size={20} color={accentColor} />
          <Text style={[styles.editProfileText, { color: accentColor }]}>
            Edit Profile
          </Text>
        </TouchableOpacity>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Stats</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="barbell" size={32} color={accentColor} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalWorkouts ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Workouts</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="time" size={32} color={accentColor} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalMinutes ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Minutes</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="flame" size={32} color={accentColor} />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats?.currentStreak ?? 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="trophy" size={32} color={accentColor} />
              <Text style={[styles.statValue, { color: colors.text }]}>
                {recentWorkouts?.filter((w) => w.completed).length ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/notifications")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/theme")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="color-palette" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Theme</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/preferences")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="settings" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/help")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleNavigate("/settings/about")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="information-circle" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleSignOut}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out" size={24} color={staticColors.error} />
              <Text style={[styles.menuItemText, styles.dangerText]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>LIFT v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
  },
  bio: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  goalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  goalText: {
    ...typography.caption,
    fontWeight: "600",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  editProfileText: {
    ...typography.body,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  statValue: {
    ...typography.h2,
  },
  statLabel: {
    ...typography.caption,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "500",
  },
  dangerItem: {
    backgroundColor: staticColors.error + "15",
  },
  dangerText: {
    color: staticColors.error,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  versionText: {
    ...typography.caption,
    fontWeight: "600",
  },
  versionSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
