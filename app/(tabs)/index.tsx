

import { Button } from "@/components/Button";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const recentWorkouts = useQuery(api.workouts.getRecent, { limit: 3 });
  const stats = useQuery(api.workouts.getStats);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back! 💪</Text>
            <Text style={styles.subtitle}>Ready to crush your workout?</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="barbell" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalWorkouts ?? 0}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.totalMinutes ?? 0}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color={colors.primary} />
            <Text style={styles.statValue}>{stats?.currentStreak ?? 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Quick Action */}
        <View style={styles.section}>
          <Button
            title="Start New Workout"
            onPress={() => router.push("/new-workout")}
            style={styles.primaryButton}
            icon="add-circle"
          />
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {!recentWorkouts ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>
                Start your first workout to see it here
              </Text>
            </View>
          ) : (
            recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout._id}
                style={styles.workoutCard}
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]",
                    params: { id: workout._id },
                  })
                }
              >
                <View style={styles.workoutCardContent}>
                  <View style={styles.workoutCardHeader}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    {workout.completed && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    )}
                  </View>
                  <Text style={styles.workoutDate}>
                    {new Date(workout.date).toLocaleDateString()}
                  </Text>
                  <Text style={styles.workoutDuration}>
                    {workout.duration} minutes
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
  },
  seeAll: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  workoutCardContent: {
    flex: 1,
  },
  workoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  workoutName: {
    ...typography.h4,
    color: colors.text,
  },
  workoutDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  workoutDuration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
