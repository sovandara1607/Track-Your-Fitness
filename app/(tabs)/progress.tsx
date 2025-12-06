

import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
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
  const stats = useQuery(api.workouts.getStats);
  const personalRecords = useQuery(api.exercises.getPersonalRecords);
  const workouts = useQuery(api.workouts.list);

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
          <Text style={styles.subtitle}>Track your fitness journey</Text>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.activityCard}>
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
                            ? colors.primary + "60"
                            : level === 2
                            ? colors.primary + "90"
                            : colors.primary,
                      },
                    ]}
                  />
                  <Text style={styles.activityLabel}>{dayLabels[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="flame"
              value={stats?.currentStreak ?? 0}
              label="Day Streak"
              color={colors.secondary}
            />
            <StatCard
              icon="trophy"
              value={stats?.totalWorkouts ?? 0}
              label="Workouts"
              color={colors.primary}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="time"
              value={Math.round((stats?.totalMinutes ?? 0) / 60)}
              label="Hours Trained"
              color={colors.accent}
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
          <Text style={styles.sectionTitle}>Personal Records 🏆</Text>
          {personalRecords === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
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
                <View key={record._id} style={styles.recordCard}>
                  <View style={styles.recordHeader}>
                    <Ionicons name="medal" size={20} color={colors.secondary} />
                    <Text style={styles.recordName} numberOfLines={1}>
                      {record.exerciseName}
                    </Text>
                  </View>
                  <View style={styles.recordStats}>
                    <View style={styles.recordStat}>
                      <Text style={styles.recordValue}>{record.maxWeight}</Text>
                      <Text style={styles.recordLabel}>lbs</Text>
                    </View>
                    <View style={styles.recordDivider} />
                    <View style={styles.recordStat}>
                      <Text style={styles.recordValue}>{record.maxReps}</Text>
                      <Text style={styles.recordLabel}>reps</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                (stats?.totalWorkouts ?? 0) >= 1 && styles.achievementUnlocked,
              ]
}
            >
              <Ionicons
                name="star"
                size={32}
             
   color={(stats?.totalWorkouts ?? 0) >= 1 ? colors.secondary : colors.textMuted}
              />
              <Text style={styles.achievementTitle}>First Step</Text>
              <Text style={styles.achievementDesc}>Complete 1 workout</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                (stats?.totalWorkouts ?? 0) >= 10 && styles.achievementUnlocked,
              ]}
            >
              <Ionicons
                name="flame"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 10 ? colors.primary : colors.textMuted}
              />
              <Text style={styles.achievementTitle}>On Fire</Text>
              <Text style={styles.achievementDesc}>Complete 10 workouts</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                (stats?.currentStreak ?? 0) >= 7 && styles.achievementUnlocked,
              ]}
            >
              <Ionicons
                name="calendar"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 7 ? colors.accent : colors.textMuted}
              />
              <Text style={styles.achievementTitle}>Week Warrior</Text>
              <Text style={styles.achievementDesc}>7 day streak</Text>
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
    backgroundColor: colors.background,
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  activityCard: {
  
  backgroundColor: colors.surface,
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
    color: colors.textMuted,
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
    color: colors.textSecondary,
  },
  recordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  recordCard: {
    backgroundColor: colors.surface,
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
    color: colors.text,
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
    color: colors.text,
  },
  recordLabel: {
    ...typography.small,
    color: colors.textMuted,
  },
  recordDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.surfaceLight,
  },
  achievementsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 1,
    borderColor: colors.secondary + "40",
  },
  achievementTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: 
"600",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  achievementDesc: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});

