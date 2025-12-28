

import { Button } from "@/components/Button";
import { ExerciseCard } from "@/components/ExerciseCard";
import { borderRadius, getCategoryColor, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ExerciseData {
  name: string;
  category: string;
  sets: Array<{ reps: number; weight: number; completed: boolean }>;
}

export default function NewWorkoutScreen() {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(Date.now());

  const { user } = useAuth();
  const { preferences, colors, accentColor } = useSettings();
  const templates = useQuery(api.templates.list, user ? { userId: user.id } : "skip");
  const createWorkout = useMutation(api.workouts.create);
  const createExercise = useMutation(api.exercises.create);
  const updateWorkout = useMutation(api.workouts.update);

  // Convert weight for display
  const displayWeight = (weightInLbs: number) => {
    if (preferences.weightUnit === "kg") {
      return Math.round(weightInLbs * 0.453592);
    }
    return weightInLbs;
  };

  const handleAddExercise = (template: {
    name: string;
    category: string;
    defaultSets: number;
    defaultReps: number;
    defaultWeight: number;
  }) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newExercise: ExerciseData = {
      name: template.name,
      category: template.category,
      sets: Array(template.defaultSets)
        .fill(null)
        .map(() => ({
          reps: template.defaultReps,
          weight: template.defaultWeight,
          completed: false,
        })),
    };

    setExercises([...exercises, newExercise]);
    setShowExercisePicker(false);
  };

  const handleToggleSet 
= (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex].completed =
      !newExercises[exerciseIndex].sets[setIndex].completed;
    setExercises(newExercises);
  };

  const handleRemoveExercise = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim() || !user) {
      return;
    }

    setLoading(true);

    try {
      const duration = Math.round((Date.now() - startTime) / 60000);
      const workoutId = await createWorkout({
        userId: user.id,
        name: workoutName,
        date: Date.now(),
        duration: Math.max(duration, 1),
      });

      // Create exercises
      for (let i = 0; i < exercises.length; i++) {
        await createExercise({
          userId: user.id,
          workoutId,
          name: exercises[i].name,
          sets: exercises[i].sets,
          order: i,
        });
      }

      // Mark as completed if all sets are done
      const allCompleted = exercises.every((e) => e.sets.every((s) => s.completed));
      if (allCompleted && exercises.length > 0) {
        await updateWorkout({ userId: user.id, workoutId, completed: true });
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      router.back();
    } catch (error) {
      console.error("Failed to save workout:", error);
    } finally {
      setLoading(false);
    }
  };

  const groupedTemplates = React.useMemo(() => {
    if (!templates) return {};
    const groups: Record<string, typeof templates> = {};
    templates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [templates]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>New Workout</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Name */}
        <View style={styles.nameSection}>
          <TextInput
            style={[styles.nameInput, { color: colors.text }]}
            placeholder="Workout Name"
            placeholderTextColor={colors.textMuted}
            value={workoutName}
            onChangeText={setWorkoutName}
            autoFocus
          />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Exercises */}
        {exercises.length > 0 && (
          <View style={styles.exercisesSection}>
            {exercises.map((exercise, index) => (
              <ExerciseCard
                key={index}
                name={exercise.name}
                sets={exercise.sets}
                category={exercise.category}
                onToggleSet={(setIndex) => handleToggleSet(index, setIndex)}
                onRemove={() => handleRemoveExercise(index)}
              />
            ))}
          </View>
        )}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={[styles.addExerciseButton, { backgroundColor: colors.surface, borderColor: accentColor + "40" }]}
          onPress={() => setShowExercisePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={accentColor} />
          <Text style={[styles.addExerciseText, { color: accentColor }]}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.surface }]}>
        <Button
          title="Save Workout"
          onPress={handleSaveWorkout}
          loading={loading}
          disabled={!workoutName.trim() || exercises.length === 0}
          style={styles.saveButton}
        />
      </View>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(category) },
                    ]}
                  />
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                {categoryTemplates.map((template) => (
                  <TouchableOpacity
                    key={template._id}
                    style={[styles.templateItem, { backgroundColor: colors.surface }]}
                    onPress={() => handleAddExercise(template)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={[styles.templateName, { color: colors.text }]}>{template.name}</Text>
                      <Text style={[styles.templateDetails, { color: colors.textSecondary }]}>
                        {template.defaultSets} sets × {template.defaultReps} reps
                        {template.defaultWeight > 0 && ` @ ${displayWeight(template.defaultWeight)} ${preferences.weightUnit}`}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={accentColor} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  nameSection: {
    marginBottom: spacing.lg,
  },
  nameInput: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
  },
  exercisesSection: {
    marginBottom: spacing.md,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addExerciseText: {
    ...typography.body,
    fontWeight: "600",
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
  saveButton: {
    width: "100%",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  modalTitle: {
    ...typography.h2,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryTitle: {
    ...typography.h3,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  templateName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  templateDetails: {
    ...typography.caption,
  },
});

