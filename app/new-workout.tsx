

import { Button } from "@/components/Button";
import { ExerciseCard } from "@/components/ExerciseCard";
import { borderRadius, colors, getCategoryColor, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
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
  const templates = useQuery(api.templates.list, user ? { userId: user.id } : "skip");
  const createWorkout = useMutation(api.workouts.create);
  const createExercise = useMutation(api.exercises.create);
  const updateWorkout = useMutation(api.workouts.update);

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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Workout</Text>
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
            style={styles.nameInput}
            placeholder="Workout Name"
            placeholderTextColor={colors.textMuted}
            value={workoutName}
            onChangeText={setWorkoutName}
            autoFocus
          />
          <Text style={styles.dateText}>
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
          style={styles.addExerciseButton}
          onPress={() => setShowExercisePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Save Bu
tton */}
      <View style={styles.footer}>
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
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
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
                  <Text style={styles.categoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                </View>
                {categoryTemplates.map((template) => (
                  <TouchableOpacity
                    key={template._id}
                    style={styles.templateItem}
                    onPress={() => handleAddExercise(template)}
                    activeOpacity={0.7}
                  >
                    <View>
                      <Text style={styles.templateName}>{template.name}</Text>
                      <Text style={styles.templateDetails}>
                        {template.defaultSets} sets × {template.defaultReps} reps
                        {template.defaultWeight > 0 && ` @ ${template.defaultWeight} lbs`}
                      </Text>
                    </View>
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
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
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  exercisesSection: {
    marginBottom: spacing.md,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary + "40",
    borderStyle: "dashed",
  },
  addExerciseText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "600",
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
  saveButton: {
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
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
    color: colors.text,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  templateName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  templateDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

