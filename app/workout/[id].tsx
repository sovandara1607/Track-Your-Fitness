import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ExerciseCard } from "@/components/ExerciseCard";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = id as Id<"workouts">;
  const { user } = useAuth();
  const { accentColor, colors } = useSettings();

  const workout = useQuery(api.workouts.getById, user ? { userId: user.id, workoutId } : "skip");
  const exercises = useQuery(api.exercises.listByWorkout, user ? { userId: user.id, workoutId } : "skip");
  const updateWorkout = useMutation(api.workouts.update);
  const updateExercise = useMutation(api.exercises.update);
  const deleteWorkout = useMutation(api.workouts.remove);

  const handleToggleSet = async (exerciseId: Id<"exercises">, setIndex: number) => {
    if (!user) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const exercise = exercises?.find((e) => e._id === exerciseId);
    if (!exercise) return;

    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };

    await updateExercise({ userId: user.id, exerciseId, sets: newSets });
  };

  const handleCompleteWorkout = async () => {
    if (!user) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateWorkout({ userId: user.id, workoutId, completed: true });
  };

  const handleDeleteWorkout = async () => {
    if (!user) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    await deleteWorkout({ userId: user.id, workoutId });
    router.back();
  };

  if (workout === undefined || exercises === undefined) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  if (workout === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="Workout Not Found"
          description="This workout may have been deleted"
          action={<Button title="Go Back" onPress={() => router.back()} />}
        />
      </SafeAreaView>
    );
  }

  const completedSets = exercises.reduce(
    (sum, e) => sum + e.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteWorkout} style={[styles.deleteButton, { backgroundColor: staticColors.error + "20" }]}>
          <Ionicons name="trash-outline" size={24} color={staticColors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text>
            {workout.completed && (
              <View style={[styles.completedBadge, { backgroundColor: staticColors.success + "20" }]}>
                <Ionicons name="checkmark-circle" size={20} color={staticColors.success} />
                <Text style={[styles.completedText, { color: staticColors.success }]}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {new Date(workout.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progress</Text>
              <Text style={[styles.progressValue, { color: colors.text }]}>
                {completedSets}/{totalSets} sets
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.surface }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: accentColor }]} />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{workout.duration} min</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{exercises.length} exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{totalSets} sets</Text>
            </View>
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
          {exercises.length === 0 ? (
            <View style={[styles.emptyExercises, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No exercises logged</Text>
            </View>
          ) : (
            exercises.map((exercise) => (
              <ExerciseCard
                key={exercise._id}
                name={exercise.name}
                sets={exercise.sets}
                onToggleSet={(setIndex) => handleToggleSet(exercise._id, setIndex)}
              />
            ))
          )}
        </View>

        {/* Notes */}
        {workout.notes && (
          <View style={styles.notesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <View style={[styles.notesCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{workout.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      {!workout.completed && exercises.length > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.surface }]}>
          <Button
            title="Complete Workout"
            onPress={handleCompleteWorkout}
            icon={<Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
            style={styles.completeButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  infoSection: {
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.h1,
    flex: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedText: {
    ...typography.small,
    fontWeight: "600",
  },
  date: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...typography.caption,
  },
  progressValue: {
    ...typography.caption,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  statText: {
    ...typography.caption,
  },
  exercisesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  emptyExercises: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
  },
  notesSection: {
    marginBottom: spacing.lg,
  },
  notesCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  notesText: {
    ...typography.body,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
  },
  completeButton: {
    width: "100%",
  },
});

