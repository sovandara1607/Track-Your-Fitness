

import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { ExerciseCard } from "@/components/ExerciseCard";
import { borderRadius, getCategoryColor, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
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

// Generate picker options
const generateSetsOptions = () => Array.from({ length: 10 }, (_, i) => i + 1);
const generateRepsOptions = () => Array.from({ length: 100 }, (_, i) => i + 1);
const generateWeightOptions = () => Array.from({ length: 301 }, (_, i) => i); // 0-300
const generateMinutesOptions = () => Array.from({ length: 121 }, (_, i) => i + 1); // 1-120 minutes
const generateSecondsOptions = () => Array.from({ length: 301 }, (_, i) => i + 1); // 1-300 seconds
const generateDurationOptions = () => Array.from({ length: 180 }, (_, i) => i + 5); // 5-184 minutes

interface ExerciseData {
  name: string;
  category: string;
  sets: Array<{ reps: number; weight: number; completed: boolean }>;
}

interface SelectedTemplate {
  name: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export default function NewWorkoutScreen() {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Duration state
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [tempDuration, setTempDuration] = useState(30);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  // State for exercise configuration modal
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [configSets, setConfigSets] = useState(3);
  const [configReps, setConfigReps] = useState(10);
  const [configWeight, setConfigWeight] = useState(0);
  
  // Temp state for pickers (commit on Done, revert on Cancel)
  const [tempConfigSets, setTempConfigSets] = useState(3);
  const [tempConfigReps, setTempConfigReps] = useState(10);
  const [tempConfigWeight, setTempConfigWeight] = useState(0);

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

  // Convert weight from display unit back to lbs for storage
  const toStorageWeight = (displayValue: number) => {
    if (preferences.weightUnit === "kg") {
      return Math.round(displayValue / 0.453592);
    }
    return displayValue;
  };

  const handleSelectTemplate = (template: SelectedTemplate) => {
    setSelectedTemplate(template);
    const sets = template.defaultSets;
    const reps = template.defaultReps;
    const weight = displayWeight(template.defaultWeight);
    setConfigSets(sets);
    setConfigReps(reps);
    setConfigWeight(weight);
    setTempConfigSets(sets);
    setTempConfigReps(reps);
    setTempConfigWeight(weight);
    setShowExercisePicker(false);
    setShowConfigModal(true);
  };

  const handleConfirmExercise = () => {
    if (!selectedTemplate) return;

    const sets = configSets;
    const reps = configReps;
    const weight = configWeight;

    if (sets < 1) {
      return;
    }
    if (reps < 1) {
      return;
    }
    if (weight < 0) {
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newExercise: ExerciseData = {
      name: selectedTemplate.name,
      category: selectedTemplate.category,
      sets: Array(sets)
        .fill(null)
        .map(() => ({
          reps,
          weight: toStorageWeight(weight),
          completed: false,
        })),
    };

    setExercises([...exercises, newExercise]);
    setShowConfigModal(false);
    setSelectedTemplate(null);
  };

  const handleCancelConfig = () => {
    setShowConfigModal(false);
    setSelectedTemplate(null);
    setShowExercisePicker(true);
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
      const workoutId = await createWorkout({
        userId: user.id,
        name: workoutName,
        date: Date.now(),
        duration: workoutDuration,
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
      <AnimatedBackground />
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

        {/* Duration Picker */}
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            setTempDuration(workoutDuration);
            setShowDurationPicker(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.durationButtonContent}>
            <Ionicons name="time-outline" size={22} color={accentColor} />
            <View>
              <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[styles.durationValue, { color: colors.text }]}>{workoutDuration} minutes</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

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
                {categoryTemplates.map((template) => {
                  const isCardio = template.category === "cardio";
                  const isTimedExercise = template.name.toLowerCase().includes("plank") || 
                                          template.name.toLowerCase().includes("hold");
                  const unitLabel = isCardio ? "min" : isTimedExercise ? "sec" : "reps";
                  
                  return (
                    <TouchableOpacity
                      key={template._id}
                      style={[styles.templateItem, { backgroundColor: colors.surface }]}
                      onPress={() => handleSelectTemplate(template)}
                      activeOpacity={0.7}
                    >
                      <View>
                        <Text style={[styles.templateName, { color: colors.text }]}>{template.name}</Text>
                        <Text style={[styles.templateDetails, { color: colors.textSecondary }]}>
                          {isCardio ? `${template.defaultReps} ${unitLabel}` : (
                            <>
                              {template.defaultSets} sets × {template.defaultReps} {unitLabel}
                              {template.defaultWeight > 0 && ` @ ${displayWeight(template.defaultWeight)} ${preferences.weightUnit}`}
                            </>
                          )}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={24} color={accentColor} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Exercise Configuration Modal */}
      <Modal
        visible={showConfigModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelConfig}
      >
        <View style={styles.configModalOverlay}>
          <View style={[styles.configModalContent, { backgroundColor: colors.surface }]}>
            {/* Header with Cancel and Done */}
            <View style={[styles.pickerModalHeader, { borderBottomColor: colors.surfaceLight }]}>
              <TouchableOpacity onPress={handleCancelConfig}>
                <Text style={[styles.pickerModalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerModalTitle, { color: colors.text }]}>
                {selectedTemplate?.name}
              </Text>
              <TouchableOpacity onPress={handleConfirmExercise}>
                <Text style={[styles.pickerModalDone, { color: accentColor }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {(() => {
              const isCardio = selectedTemplate?.category === "cardio";
              const isTimedExercise = selectedTemplate?.name?.toLowerCase().includes("plank") || 
                                      selectedTemplate?.name?.toLowerCase().includes("hold");
              const timeLabel = isCardio ? "Minutes" : isTimedExercise ? "Seconds" : "Reps";
              const timeOptions = isCardio ? generateMinutesOptions() : isTimedExercise ? generateSecondsOptions() : generateRepsOptions();
              
              return (
                <View style={styles.configPickerContainer}>
                  {!isCardio && (
                    <View style={styles.configPickerColumn}>
                      <Text style={[styles.configPickerLabel, { color: colors.textSecondary }]}>Sets</Text>
                      <View style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                        <Picker
                          selectedValue={tempConfigSets}
                          onValueChange={(value) => {
                            setTempConfigSets(value);
                            setConfigSets(value);
                          }}
                          style={styles.picker}
                          itemStyle={[styles.pickerItem, { color: colors.text }]}
                        >
                          {generateSetsOptions().map((num) => (
                            <Picker.Item key={num} label={String(num)} value={num} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}
                  <View style={styles.configPickerColumn}>
                    <Text style={[styles.configPickerLabel, { color: colors.textSecondary }]}>{timeLabel}</Text>
                    <View style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                      <Picker
                        selectedValue={tempConfigReps}
                        onValueChange={(value) => {
                          setTempConfigReps(value);
                          setConfigReps(value);
                        }}
                        style={styles.picker}
                        itemStyle={[styles.pickerItem, { color: colors.text }]}
                      >
                        {timeOptions.map((num) => (
                          <Picker.Item key={num} label={String(num)} value={num} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  {!isCardio && (
                    <View style={styles.configPickerColumn}>
                      <Text style={[styles.configPickerLabel, { color: colors.textSecondary }]}>
                        {preferences.weightUnit.toUpperCase()}
                      </Text>
                      <View style={[styles.pickerWrapper, { backgroundColor: colors.background }]}>
                        <Picker
                          selectedValue={tempConfigWeight}
                          onValueChange={(value) => {
                            setTempConfigWeight(value);
                            setConfigWeight(value);
                          }}
                          style={styles.picker}
                          itemStyle={[styles.pickerItem, { color: colors.text }]}
                        >
                          {generateWeightOptions().map((num) => (
                            <Picker.Item key={num} label={String(num)} value={num} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.durationModalOverlay}>
          <View style={[styles.durationModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerModalHeader, { borderBottomColor: colors.surfaceLight }]}>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Text style={[styles.pickerModalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerModalTitle, { color: colors.text }]}>Duration</Text>
              <TouchableOpacity onPress={() => {
                setWorkoutDuration(tempDuration);
                setShowDurationPicker(false);
              }}>
                <Text style={[styles.pickerModalDone, { color: accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.durationPickerContainer}>
              <Picker
                selectedValue={tempDuration}
                onValueChange={(value) => setTempDuration(value)}
                style={styles.durationPicker}
                itemStyle={[styles.pickerItem, { color: colors.text }]}
              >
                {generateDurationOptions().map((num) => (
                  <Picker.Item key={num} label={`${num} min`} value={num} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
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
  durationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  durationButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  durationLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  durationValue: {
    ...typography.body,
    fontWeight: "600",
  },
  durationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  durationModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  durationPickerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  durationPicker: {
    width: "100%",
    height: 200,
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
  // Configuration Modal Styles
  configModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  configModalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  pickerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  pickerModalCancel: {
    ...typography.body,
    fontSize: 17,
  },
  pickerModalTitle: {
    ...typography.body,
    fontWeight: "600",
    fontSize: 17,
  },
  pickerModalDone: {
    ...typography.body,
    fontWeight: "600",
    fontSize: 17,
  },
  configPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  configPickerColumn: {
    flex: 1,
    alignItems: "center",
    maxWidth: 120,
  },
  configPickerLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textAlign: "center",
    fontWeight: "600",
  },
  pickerWrapper: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    width: "100%",
  },
  picker: {
    width: "100%",
    height: 180,
  },
  pickerItem: {
    fontSize: 22,
  },
  configButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  configButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  configButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
});

