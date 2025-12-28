import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { WorkoutCard } from "@/components/WorkoutCard";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Motivational stats messages
const REFRESH_MESSAGES = [
  "You're doing amazing! 💪",
  "Every rep counts!",
  "Consistency is key! 🔑",
  "Champions train, losers complain!",
  "Be stronger than your excuses!",
  "Your only limit is you!",
  "Make yourself proud! ⭐",
  "Progress, not perfection!",
];

export default function WorkoutsScreen() {
  const { user } = useAuth();
  const { colors, accentColor } = useSettings();
  const workouts = useQuery(api.workouts.list, user ? { userId: user.id } : "skip");
  const deleteWorkout = useMutation(api.workouts.remove);
  const updateWorkout = useMutation(api.workouts.update);
  
  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const messageOpacity = useRef(new Animated.Value(0)).current;

  const handleNewWorkout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/new-workout");
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setRefreshMessage(REFRESH_MESSAGES[Math.floor(Math.random() * REFRESH_MESSAGES.length)]);
    setShowMessage(true);
    
    Animated.timing(messageOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setRefreshing(false);
      setTimeout(() => {
        Animated.timing(messageOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowMessage(false));
      }, 2000);
    }, 800);
  }, [messageOpacity]);

  // Calculate difficulty based on workout duration
  const getDifficulty = (duration: number): "easy" | "medium" | "hard" | "intense" => {
    if (duration < 20) return "easy";
    if (duration < 40) return "medium";
    if (duration < 60) return "hard";
    return "intense";
  };

  const handleDeleteWorkout = (workoutId: Id<"workouts">, workoutName: string) => {
    if (!user) return;
    
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${workoutName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await deleteWorkout({ userId: user.id, workoutId });
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (workoutId: Id<"workouts">, currentFavorite?: boolean) => {
    if (!user) return;
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    await updateWorkout({
      userId: user.id,
      workoutId,
      favorite: !currentFavorite,
    });
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
      <AnimatedBackground />
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
      >
        {/* Refresh Message Banner */}
        {showMessage && (
          <Animated.View style={[styles.refreshBanner, { backgroundColor: accentColor + "15", opacity: messageOpacity }]}>
            <Ionicons name="fitness" size={20} color={accentColor} />
            <Text style={[styles.refreshMessage, { color: colors.text }]}>{refreshMessage}</Text>
          </Animated.View>
        )}

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
                  difficulty={getDifficulty(workout.duration)}
                  isFavorite={workout.favorite}
                  onPress={() => router.push(`/workout/${workout._id}`)}
                  onDelete={() => handleDeleteWorkout(workout._id, workout.name)}
                  onFavorite={() => handleToggleFavorite(workout._id, workout.favorite)}
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
  refreshBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  refreshMessage: {
    ...typography.body,
    fontWeight: "600",
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
    bottom: 100,
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

