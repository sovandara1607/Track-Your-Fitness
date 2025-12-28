import { Button } from "@/components/Button";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accentColor, colors } = useSettings();
  const recentWorkouts = useQuery(
    api.workouts.getRecent,
    user ? { userId: user.id, limit: 3 } : "skip",
  );
  const stats = useQuery(
    api.workouts.getStats,
    user ? { userId: user.id } : "skip",
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Welcome Back! 💪</Text>
            <Text style={[styles.greeting, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Ready to crush your workout?</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="barbell" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalWorkouts ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="time" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalMinutes ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="flame" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.currentStreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
        </View>

        {/* Quick Action */}
        <View style={styles.section}>
          <Button
            title="Start New Workout"
            onPress={() => router.push("/new-workout")}
            style={styles.primaryButton}
          />
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
              <Text style={[styles.seeAll, { color: accentColor }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {!recentWorkouts ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons
                name="barbell-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Start your first workout to see it here
              </Text>
            </View>
          ) : (
            recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout._id}
                style={[styles.workoutCard, { backgroundColor: colors.surface }]}
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]",
                    params: { id: workout._id },
                  })
                }
              >
                <View style={styles.workoutCardContent}>
                  <View style={styles.workoutCardHeader}>
                    <Text style={[styles.workoutName, { color: colors.text }]}>{workout.name}</Text>
                    {workout.completed && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={staticColors.success}
                      />
                    )}
                  </View>
                  <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
                    {new Date(workout.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.workoutDuration, { color: colors.textMuted }]}>
                    {workout.duration} minutes
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
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
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    gap: spacing.xs,
  },
  statValue: {
    ...typography.h2,
  },
  statLabel: {
    ...typography.caption,
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
  },
  seeAll: {
    ...typography.body,
    fontWeight: "600",
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
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
    ...typography.h3,
  },
  workoutDate: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  workoutDuration: {
    ...typography.caption,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
