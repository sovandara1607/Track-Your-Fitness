import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { WorkoutCard } from "@/components/WorkoutCard";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
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
  const { user } = useAuth();
  const { colors, accentColor } = useSettings();
  const workouts = useQuery(api.workouts.list, user ? { userId: user.id } : "skip");

  const handleNewWorkout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/new-workout");
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Workouts</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.surface }]} onPress={handleNewWorkout}>
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
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading workouts...</Text>
 
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
              <Text style={[styles.monthTitle, { color: colors.textSecondary }]}>{month}</Text>
              {monthWorkouts.map((workout: Doc<"workouts">) => (
                <WorkoutCard
                  key={workout._id}
                  name={workout.name}
                  date={workout.date}
                  duration={workout.duration}
                  completed={workout.completed}
                  onPress={() => router.push(`/workout/${workout._id}`)}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {workouts && workouts.length > 0 && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: accentColor, shadowColor: accentColor }]} onPress={handleNewWorkout} activeOpacity={0.8}>
          <Ionicons name="add" size={32} color={staticColors.text} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  addButton: {
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
  },
  monthSection: {
    marginBottom: spacing.lg,
  },
  monthTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});

