

import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function ProgressScreen() {
  const { user } = useAuth();
  const { preferences, accentColor, colors } = useSettings();
  const stats = useQuery(api.workouts.getStats, user ? { userId: user.id } : "skip");
  const personalRecords = useQuery(api.exercises.getPersonalRecords, user ? { userId: user.id } : "skip");
  const workouts = useQuery(api.workouts.list, user ? { userId: user.id } : "skip");

  // Helper function to convert weight based on preference
  const displayWeight = (weightInLbs: number) => {
    if (preferences.weightUnit === "kg") {
      return Math.round(weightInLbs * 0.453592);
    }
    return weightInLbs;
  };

  // Calculate weekly activity
  const weeklyActivity = React.useMemo(() => {
    if (!workouts) return Array(7).fill(0);

    const now = Date.now();
    const activity = Array(7).fill(0);

    workouts.forEach((workout) => {
      if (workout.completed) {
        const daysAgo = Math.floor((now - workout.date) / (24 * 60 * 60 * 1000));
        if (daysAgo >= 0 && daysAgo < 7) {
          activity[6 - daysAgo] = Math.min(activity[6 - daysAgo] + 1, 3);
        }
      }
    });

    return activity;
  }, [workouts]);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your fitness journey</Text>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
            <View style={styles.activityGrid}>
              {weeklyActivity.map((level, index) => (
                <View key={index} style={styles.activityDay}>
                  <View
                    style={[
                      styles.activityBar,
                      {
                        height: level === 0 ? 8 : 20 + level * 20,
                        backgroundColor:
                          level === 0
                            ? colors.surfaceLight
                            : level === 1
                            ? accentColor + "60"
                            : level === 2
                            ? accentColor + "90"
                            : accentColor,
                      },
                    ]}
                  />
                  <Text style={[styles.activityLabel, { color: colors.textMuted }]}>{dayLabels[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="flame"
              value={stats?.currentStreak ?? 0}
              label="Day Streak"
              color={staticColors.secondary}
            />
            <StatCard
              icon="trophy"
              value={stats?.totalWorkouts ?? 0}
              label="Workouts"
              color={accentColor}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="time"
              value={Math.round((stats?.totalMinutes ?? 0) / 60)}
              label="Hours Trained"
              color={staticColors.accent}
            />
            <StatCard
              icon="calendar"
              value={stats?.thisWeekWorkouts ?? 0}
              label="This Week"
              color="#5856D6"
            />
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Records 🏆</Text>
          {personalRecords === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : personalRecords.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="No Records Yet"
              description="Complete workouts to set your personal records"
            />
          ) : (
            <View style={styles.recordsGrid}>
              {personalRecords.slice(0, 6).map((record) => (
                <View key={record._id} style={[styles.recordCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.recordHeader}>
                    <Ionicons name="medal" size={20} color={staticColors.secondary} />
                    <Text style={[styles.recordName, { color: colors.text }]} numberOfLines={1}>
                      {record.exerciseName}
                    </Text>
                  </View>
                  <View style={styles.recordStats}>
                    <View style={styles.recordStat}>
                      <Text style={[styles.recordValue, { color: colors.text }]}>{displayWeight(record.maxWeight)}</Text>
                      <Text style={[styles.recordLabel, { color: colors.textMuted }]}>{preferences.weightUnit}</Text>
                    </View>
                    <View style={[styles.recordDivider, { backgroundColor: colors.surfaceLight }]} />
                    <View style={styles.recordStat}>
                      <Text style={[styles.recordValue, { color: colors.text }]}>{record.maxReps}</Text>
                      <Text style={[styles.recordLabel, { color: colors.textMuted }]}>reps</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 1 && [styles.achievementUnlocked, { borderColor: staticColors.secondary + "40" }],
              ]}
            >
              <Ionicons
                name="star"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 1 ? staticColors.secondary : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>First Step</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>Complete 1 workout</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 10 && [styles.achievementUnlocked, { borderColor: accentColor + "40" }],
              ]}
            >
              <Ionicons
                name="flame"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 10 ? accentColor : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>On Fire</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>Complete 10 workouts</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.currentStreak ?? 0) >= 7 && [styles.achievementUnlocked, { borderColor: staticColors.accent + "40" }],
              ]}
            >
              <Ionicons
                name="calendar"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 7 ? staticColors.accent : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Week Warrior</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>7 day streak</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  activityCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  activityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  activityDay: {
    alignItems: "center",
    flex: 1,
  },
  activityBar: {
    width: 24,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  activityLabel: {
    ...typography.small,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
  },
  recordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  recordCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recordName: {
    ...typography.caption,
    fontWeight: "600",
    flex: 1,
  },
  recordStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordStat: {
    flex: 1,
    alignItems: "center",
  },
  recordValue: {
    ...typography.h2,
  },
  recordLabel: {
    ...typography.small,
  },
  recordDivider: {
    width: 1,
    height: 30,
  },
  achievementsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  achievementCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 1,
  },
  achievementTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  achievementDesc: {
    ...typography.small,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

