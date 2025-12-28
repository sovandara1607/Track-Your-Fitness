import { borderRadius, getCategoryColor, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Set {
  reps: number;
  weight: number;
  completed: boolean;
}

interface ExerciseCardProps {
  name: string;
  sets: Set[];
  category?: string;
  onToggleSet?: (setIndex: number) => void;
  onEditSet?: (setIndex: number) => void;
  onRemove?: () => void;
}

export function ExerciseCard({
  name,
  sets,
  category = "chest",
  onToggleSet,
  onEditSet,
  onRemove,
}: ExerciseCardProps) {
  const { preferences, colors } = useSettings();
  const categoryColor = getCategoryColor(category);
  const completedSets = sets.filter((s) => s.completed).length;

  // Convert weight based on user preference
  const displayWeight = (weightInLbs: number) => {
    if (preferences.weightUnit === "kg") {
      return Math.round(weightInLbs * 0.453592);
    }
    return weightInLbs;
  };

  const handleToggleSet = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleSet?.(index);
  };

  const handleLongPressSet = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    onEditSet?.(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.progress, { color: colors.textSecondary }]}>
            {completedSets}/{sets.length}
          </Text>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={18} color={staticColors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.setsContainer, { backgroundColor: colors.surfaceLight }]}>
        <View style={[styles.setsHeader, { borderBottomColor: colors.surface }]}>
          <Text style={[styles.setHeaderText, { flex: 1, color: colors.textMuted }]}>SET</Text>
          <Text style={[styles.setHeaderText, { flex: 2, color: colors.textMuted }]}>WEIGHT</Text>
          <Text style={[styles.setHeaderText, { flex: 2, color: colors.textMuted }]}>REPS</Text>
          <Text style={[styles.setHeaderText, { width: 40, color: colors.textMuted }]}>✓</Text>
        </View>

        {sets.map((set, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.setRow, { borderBottomColor: colors.surface }, set.completed && { backgroundColor: staticColors.success + "10" }]}
            onPress={() => handleToggleSet(index)}
            onLongPress={() => handleLongPressSet(index)}
            delayLongPress={400}
            activeOpacity={0.7}
          >
            <Text style={[styles.setText, { flex: 1, color: colors.text }]}>{index + 1}</Text>
            <Text style={[styles.setText, { flex: 2, color: colors.text }]}>
              {set.weight > 0 ? `${displayWeight(set.weight)} ${preferences.weightUnit}` : "BW"}
            </Text>
            <Text style={[styles.setText, { flex: 2, color: colors.text }]}>{set.reps}</Text>
            <View style={{ width: 40, alignItems: "center" }}>
              <View
                style={[
                  styles.checkbox,
                  { borderColor: colors.textMuted },
                  set.completed && { backgroundColor: staticColors.success, borderColor: staticColors.success },
                ]}
              >
                {set.completed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    ...typography.h3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progress: {
    ...typography.caption,
  },
  removeButton: {
    padding: spacing.xs,
  },
  setsContainer: {
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  setsHeader: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  setHeaderText: {
    ...typography.small,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  setText: {
    ...typography.body,
    textAlign: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

