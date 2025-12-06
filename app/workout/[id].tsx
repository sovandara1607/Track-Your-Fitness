

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { colors, spacing, borderRadius, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { ExerciseCard } from "@/components/ExerciseCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = id as Id<"workouts">;

  const workout = useQuery(api.workouts.getById, { workoutId });
  const exercises = useQuery(api.exercises.listByWorkout, { workoutId });
  const updateWorkout = useMutation(api.workouts.update);
  const updateExercise = useMutation(api.exercises.update);
  const deleteWorkout = useMutation(api.workouts.remove);

  const handleToggleSet = async (exerciseId: Id<"exercises">, setIndex: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const exercise = exercises?.find((e) => e._id === exerciseId);
    if (!exercise) return;

    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };

    await updateExercise({ exerciseId, sets: newSets });
  };

  const handleCompleteWorkout = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateWorkout({ workoutId, completed: true });
  };

  const handleDeleteWorkout = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedback
Style.Heavy);
    }
    await deleteWorkout({ workoutId });
    router.back();
  };

  if (workout === undefined || exercises === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (workout === null) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteWorkout} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color={colors.error} />
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
            <Text style={styles.title}>{workout.name}</Text>
            {workout.completed && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>
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
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressValue}>
                {completedSets}/{totalSets} sets
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statText}>{workout.duration} min</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statText}>{exercises.length} exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="layers-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.statText}>{totalSets} sets</Text>
            </View>
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {exercises.length === 0 ? (
            <View style={styles.emptyExercises}>
              <Text style={styles.emptyText}>No exercises logged</Text>
            </View>
     
     ) : (
            exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.
_id}
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
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{workout.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Complete Button */}
      {!workout.completed && exercises.length > 0 && (
        <View style={styles.footer}>
          <Button
            title="Complete Workout"
            onPress={handleCompleteWorkout}
            icon={<Ionicons name="checkmark-circle" size={20} color={colors.text} />}
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error + "20",
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
    ...typography.h
1,
    color: colors.text,
    flex: 1,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.success + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  completedText: {
    ...typography.small,
    color: colors.success,
    fontWeight: "600",
  },
  date: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  progressValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: "600",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
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
    color: colors.textSecondary,
  },
  exercisesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyExercises: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
  },
  notesSection: {
    marginBottom: spacing.lg,
  },
  notesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  notesText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  completeButton: {
    width: "100%",
  },
});

