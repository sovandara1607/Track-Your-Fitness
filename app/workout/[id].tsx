import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ExerciseCard } from "@/components/ExerciseCard";
import { HydrationTracker } from "@/components/HydrationTracker";
import { MusicPlayer } from "@/components/MusicPlayer";
import { RestTimer } from "@/components/RestTimer";
import { borderRadius, getCategoryColor, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { sendWorkoutCompletedNotification } from "@/lib/notifications";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
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
const generateDurationOptions = () => Array.from({ length: 180 }, (_, i) => i + 5); // 5-184 minutes
const generateWeightOptions = () => Array.from({ length: 301 }, (_, i) => i); // 0-300
const generateRepsOptions = () => Array.from({ length: 100 }, (_, i) => i + 1); // 1-100

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = id as Id<"workouts">;
  const { user } = useAuth();
  const { accentColor, colors, preferences } = useSettings();

  // State for editing modals
  const [durationModalVisible, setDurationModalVisible] = React.useState(false);
  const [tempDuration, setTempDuration] = React.useState(30);
  const [nameModalVisible, setNameModalVisible] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editSetModalVisible, setEditSetModalVisible] = React.useState(false);
  const [editingExercise, setEditingExercise] = React.useState<{
    exerciseId: Id<"exercises">;
    exerciseName: string;
    setIndex: number;
    weight: number;
    reps: number;
  } | null>(null);
  const [tempWeight, setTempWeight] = React.useState(0);
  const [tempReps, setTempReps] = React.useState(10);
  const [showExercisePicker, setShowExercisePicker] = React.useState(false);

  const workout = useQuery(api.workouts.getById, user ? { userId: user.id, workoutId } : "skip");
  const exercises = useQuery(api.exercises.listByWorkout, user ? { userId: user.id, workoutId } : "skip");
  const templates = useQuery(api.templates.list, user ? { userId: user.id } : "skip");
  const updateWorkout = useMutation(api.workouts.update);
  const updateExercise = useMutation(api.exercises.update);
  const createExercise = useMutation(api.exercises.create);
  const deleteWorkout = useMutation(api.workouts.remove);

  // Convert weight based on user preference for display
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

  // Group templates by category for the picker
  const groupedTemplates = React.useMemo(() => {
    if (!templates) return {};
    const groups: Record<string, typeof templates> = {};
    templates.forEach((t) => {
      if (!groups[t.category]) groups[t.category] = [];
      groups[t.category].push(t);
    });
    return groups;
  }, [templates]);

  const handleAddExercise = async (template: {
    name: string;
    category: string;
    defaultSets: number;
    defaultReps: number;
    defaultWeight: number;
  }) => {
    if (!user || !exercises) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const sets = Array(template.defaultSets)
      .fill(null)
      .map(() => ({
        reps: template.defaultReps,
        weight: template.defaultWeight,
        completed: false,
      }));

    await createExercise({
      userId: user.id,
      workoutId,
      name: template.name,
      sets,
      order: exercises.length,
    });

    setShowExercisePicker(false);
  };

  const handleEditDuration = () => {
    if (workout) {
      setTempDuration(workout.duration);
      setDurationModalVisible(true);
    }
  };

  const handleSaveDuration = async () => {
    if (!user || !workout) return;
    await updateWorkout({ userId: user.id, workoutId, duration: tempDuration });
    setDurationModalVisible(false);
  };

  const handleEditName = () => {
    if (workout) {
      setEditName(workout.name);
      setNameModalVisible(true);
    }
  };

  const handleSaveName = async () => {
    if (!user || !workout) return;
    const newName = editName.trim();
    if (!newName) {
      Alert.alert("Invalid Name", "Please enter a workout name.");
      return;
    }
    await updateWorkout({ userId: user.id, workoutId, name: newName });
    setNameModalVisible(false);
  };

  const handleEditSet = (exerciseId: Id<"exercises">, setIndex: number) => {
    const exercise = exercises?.find((e) => e._id === exerciseId);
    if (!exercise) return;
    const set = exercise.sets[setIndex];
    const weight = displayWeight(set.weight);
    const reps = set.reps;
    setEditingExercise({
      exerciseId,
      exerciseName: exercise.name,
      setIndex,
      weight,
      reps,
    });
    setTempWeight(weight);
    setTempReps(reps);
    setEditSetModalVisible(true);
  };

  const handleSaveSet = async () => {
    if (!user || !editingExercise) return;
    const weight = editingExercise.weight;
    const reps = editingExercise.reps;
    
    if (weight < 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight.");
      return;
    }
    if (reps < 1) {
      Alert.alert("Invalid Reps", "Please enter a valid number of reps.");
      return;
    }

    const exercise = exercises?.find((e) => e._id === editingExercise.exerciseId);
    if (!exercise) return;

    const newSets = [...exercise.sets];
    newSets[editingExercise.setIndex] = {
      ...newSets[editingExercise.setIndex],
      weight: toStorageWeight(weight),
      reps,
    };

    await updateExercise({ userId: user.id, exerciseId: editingExercise.exerciseId, sets: newSets });
    setEditSetModalVisible(false);
    setEditingExercise(null);
  };

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
    if (!user || !workout) return;
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateWorkout({ userId: user.id, workoutId, completed: true });
    
    // Send notification
    try {
      await sendWorkoutCompletedNotification(workout.name);
    } catch (error) {
      console.log("Failed to send notification:", error);
    }
  };

  const handleUncompleteWorkout = async () => {
    if (!user) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await updateWorkout({ userId: user.id, workoutId, completed: false });
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
      <AnimatedBackground />
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
            <TouchableOpacity onPress={handleEditName} style={styles.titleButton}>
              <Text style={[styles.title, { color: colors.text }]}>{workout.name}</Text>
              <Ionicons name="pencil" size={18} color={accentColor} style={styles.titleEditIcon} />
            </TouchableOpacity>
            <View style={[styles.completedBadge, { backgroundColor: workout.completed ? staticColors.success + "20" : staticColors.warning + "20" }]}>
              <Ionicons 
                name={workout.completed ? "checkmark-circle" : "time-outline"} 
                size={20} 
                color={workout.completed ? staticColors.success : staticColors.warning} 
              />
              <Text style={[styles.completedText, { color: workout.completed ? staticColors.success : staticColors.warning }]}>
                {workout.completed ? "Completed" : "In Progress"}
              </Text>
            </View>
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
            <TouchableOpacity 
              style={styles.statItem} 
              onLongPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                handleEditDuration();
              }}
              delayLongPress={150}
            >
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>{workout.duration} min</Text>
            </TouchableOpacity>
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

        {/* Smart Workout Tools */}
        {!workout.completed && (
          <View style={styles.smartToolsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Smart Tools</Text>
            <RestTimer defaultSeconds={60} />
            <HydrationTracker />
            <MusicPlayer minimized />
          </View>
        )}

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Exercises</Text>
          {exercises.length === 0 ? (
            <View style={[styles.emptyExercises, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No exercises logged</Text>
            </View>
          ) : (
            exercises.map((exercise) => {
              // Look up the category from templates
              const template = templates?.find((t) => t.name === exercise.name);
              const category = template?.category || "chest";
              
              return (
                <ExerciseCard
                  key={exercise._id}
                  name={exercise.name}
                  sets={exercise.sets}
                  category={category}
                  onToggleSet={(setIndex) => handleToggleSet(exercise._id, setIndex)}
                  onEditSet={(setIndex) => handleEditSet(exercise._id, setIndex)}
                />
              );
            })
          )}

          {/* Add Exercise Button (when not completed) */}
          {!workout.completed && (
            <TouchableOpacity
              style={[styles.addExerciseButton, { backgroundColor: colors.surface, borderColor: accentColor + "40" }]}
              onPress={() => setShowExercisePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={24} color={accentColor} />
              <Text style={[styles.addExerciseText, { color: accentColor }]}>Add Exercise</Text>
            </TouchableOpacity>
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

      {/* Reopen Workout Button (when completed) */}
      {workout.completed && (
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.reopenButton, { backgroundColor: colors.surface, borderColor: accentColor }]}
            onPress={handleUncompleteWorkout}
          >
            <Ionicons name="refresh-outline" size={20} color={accentColor} />
            <Text style={[styles.reopenButtonText, { color: accentColor }]}>Reopen Workout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Duration Edit Modal */}
      <Modal
        visible={durationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDurationModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerModalHeader, { borderBottomColor: colors.surfaceLight }]}>
              <TouchableOpacity onPress={() => setDurationModalVisible(false)}>
                <Text style={[styles.pickerModalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerModalTitle, { color: colors.text }]}>Duration</Text>
              <TouchableOpacity onPress={handleSaveDuration}>
                <Text style={[styles.pickerModalDone, { color: accentColor }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.singlePickerContainer}>
              <Picker
                selectedValue={tempDuration}
                onValueChange={(value) => setTempDuration(value)}
                style={styles.singlePicker}
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

      {/* Name Edit Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { justifyContent: "flex-start", paddingTop: 120 }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Workout</Text>
            <TextInput
              style={[styles.modalInput, styles.modalInputText, { backgroundColor: colors.background, color: colors.text, borderColor: colors.textMuted }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Workout name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setNameModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: accentColor }]}
                onPress={handleSaveName}
              >
                <Text style={[styles.modalButtonText, { color: "#FFFFFF" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Edit Modal */}
      <Modal
        visible={editSetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditSetModalVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={[styles.pickerModalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.pickerModalHeader, { borderBottomColor: colors.surfaceLight }]}>
              <TouchableOpacity onPress={() => {
                setEditSetModalVisible(false);
                setEditingExercise(null);
              }}>
                <Text style={[styles.pickerModalCancel, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.pickerModalTitle, { color: colors.text }]}>Edit Set</Text>
              <TouchableOpacity onPress={handleSaveSet}>
                <Text style={[styles.pickerModalDone, { color: accentColor }]}>Save</Text>
              </TouchableOpacity>
            </View>
            
            {(() => {
              // Check if this is a cardio or timed exercise
              const exerciseName = editingExercise?.exerciseName?.toLowerCase() || "";
              const isCardio = templates?.find(t => t.name === editingExercise?.exerciseName)?.category === "cardio";
              const isTimedExercise = exerciseName.includes("plank") || exerciseName.includes("hold") || exerciseName.includes("wall sit");
              const timeLabel = isCardio ? "Minutes" : isTimedExercise ? "Seconds" : "Reps";
              const timeOptions = isCardio 
                ? Array.from({ length: 120 }, (_, i) => i + 1) 
                : isTimedExercise 
                  ? Array.from({ length: 300 }, (_, i) => i + 1)
                  : generateRepsOptions();
              
              return (
                <View style={styles.editSetPickerContainer}>
                  {!isCardio && (
                    <View style={styles.editSetPickerColumn}>
                      <Text style={[styles.editSetPickerLabel, { color: colors.textSecondary }]}>
                        Weight ({preferences.weightUnit.toUpperCase()})
                      </Text>
                      <View style={[styles.editSetPickerWrapper, { backgroundColor: colors.background }]}>
                        <Picker
                          selectedValue={tempWeight}
                          onValueChange={(value) => {
                            setTempWeight(value);
                            setEditingExercise(prev => prev ? { ...prev, weight: value } : null);
                          }}
                          style={styles.editSetPicker}
                          itemStyle={[styles.pickerItem, { color: colors.text }]}
                        >
                          {generateWeightOptions().map((num) => (
                            <Picker.Item key={num} label={String(num)} value={num} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  )}

                  <View style={styles.editSetPickerColumn}>
                    <Text style={[styles.editSetPickerLabel, { color: colors.textSecondary }]}>{timeLabel}</Text>
                    <View style={[styles.editSetPickerWrapper, { backgroundColor: colors.background }]}>
                      <Picker
                        selectedValue={tempReps}
                        onValueChange={(value) => {
                          setTempReps(value);
                          setEditingExercise(prev => prev ? { ...prev, reps: value } : null);
                        }}
                        style={styles.editSetPicker}
                        itemStyle={[styles.pickerItem, { color: colors.text }]}
                      >
                        {timeOptions.map((num) => (
                          <Picker.Item key={num} label={String(num)} value={num} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <SafeAreaView style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.pickerHeader, { borderBottomColor: colors.surface }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Add Exercise</Text>
            <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.pickerContent}>
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
                      onPress={() => handleAddExercise(template)}
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
                      <Ionicons name="add-circle-outline" size={24} color={accentColor} />
                    </TouchableOpacity>
                  );
                })}
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
  titleButton: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  titleEditIcon: {
    marginTop: 4,
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
  smartToolsSection: {
    marginBottom: spacing.lg,
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
  reopenButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  reopenButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  modalLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  modalInputGroup: {
    marginBottom: spacing.md,
  },
  modalInput: {
    ...typography.body,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    textAlign: "center",
    fontSize: 18,
  },
  modalInputText: {
    textAlign: "left",
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  // Apple-style Picker Modal styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  pickerModalContent: {
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
  singlePickerContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  singlePicker: {
    width: "100%",
    height: 200,
  },
  pickerItem: {
    fontSize: 22,
  },
  editSetPickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  editSetPickerColumn: {
    flex: 1,
    alignItems: "center",
    maxWidth: 150,
  },
  editSetPickerLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
    textAlign: "center",
    fontWeight: "600",
  },
  editSetPickerWrapper: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
    width: "100%",
  },
  editSetPicker: {
    width: "100%",
    height: 180,
  },
  // Add Exercise Button
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  addExerciseText: {
    ...typography.body,
    fontWeight: "600",
  },
  // Exercise Picker Modal
  pickerContainer: {
    flex: 1,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    ...typography.h2,
  },
  pickerContent: {
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
    marginBottom: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryTitle: {
    ...typography.h3,
  },
  templateItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  templateName: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  templateDetails: {
    ...typography.small,
  },
});

