import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { WorkoutCard } from "@/components/WorkoutCard";
import { borderRadius, colors, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WorkoutsScreen() {
  const workouts = useQuery(api.workouts.list);

  const handleNewWorkout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/new-workout" as any);
  };

  // Group workouts by month
  const groupedWorkouts = React.useMemo(() => {
    if (!workouts) return {};

    const groups: Record<string, typeof workouts> = {};
    workouts.forEach((workout: Doc<"workouts">) => {
      const date = new Date(workout.date);
      const key = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(workout);
    });
    return groups;
  }, [workouts]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNewWorkout}>
          <Ionicons name="add" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {workouts === undefined ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading workouts...</Text>
 
         </View>
        ) : workouts.length === 0 ? (
          <EmptyState
            icon="barbell-outline"
            title="No Workouts Yet"
            description="Start tracking your fitness journey by creating your first workout"
            action={
              <Button
                title="Create Workout"
                onPress={handleNewWorkout}
                icon={<Ionicons name="add" size={20} color={colors.text} />}
              />
            }
          />
        ) : (
          Object.entries(groupedWorkouts).map(([month, monthWorkouts]) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              {monthWorkouts.map((workout: Doc<"workouts">) => (
                <WorkoutCard
                  key={workout._id}
                  name={workout.name}
                  date={workout.date}
                  duration={workout.duration}
                  completed={workout.completed}
                  onPress={() => router.push(`/workout/${workout._id}` as any)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {workouts && workouts.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleNewWorkout} activeOpacity={0.8}>
          <Ionicons name="add" size={32} color={colors.text} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  monthSection: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

