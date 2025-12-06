import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { colors, spacing, borderRadius, typography, getCategoryColor } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

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
  onRemove?: () => void;
}

export function ExerciseCard({
  name,
  sets,
  category = "chest",
  onToggleSet,
  onRemove,
}: ExerciseCardProps) {
  const categoryColor = getCategoryColor(category);
  const completedSets = sets.filter((s) => s.completed).length;

  const handleToggleSet = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onToggleSet?.(index);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.progress}>
            {completedSets}/{sets.length}
          </Text>
          {onRemove && (
            <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.setsContainer}>
        <View style={styles.setsHeader}>
          <Text style={[styles.setHeaderText, { flex: 1 }]}>SET</Text>
          <Text style={[styles.setHeaderText, { flex: 2 }]}>WEIGHT</Text>
          <Text style={[styles.setHeaderText, { flex: 2 }]}>REPS</Text>
          <Text style={[styles.setHeaderText, { width: 40 }]}>✓</Text>
        </View>

        {sets.map((set, index) => (
       
   <TouchableOpacity
            key={index}
            style={[styles.setRow, set.completed && styles.setRowCompleted]}
            onPress={() => handleToggleSet(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.setText, { flex: 1 }]}>{index + 1}</Text>
            <Text style={[styles.setText, { flex: 2 }]}>
              {set.weight > 0 ? `${set.weight} lbs` : "BW"}
            </Text>
            <Text style={[styles.setText, { flex: 2 }]}>{set.reps}</Text>
            <View style={{ width: 40, alignItems: "center" }}>
              <View
                style={[
                  styles.checkbox,
                  set.completed && { backgroundColor: colors.success, borderColor: colors.success },
                ]}
              >
                {set.completed && <Ionicons name="checkmark" size={14} color={colors.text} />}
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
    backgroundColor: colors.surface,
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
    color: colors.text,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  progress: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: spacing.xs,
  },
  setsContainer: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  setsHeader: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  setHeaderText: {
    ...typography.small,
    color: colors.textMuted,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  setRowCompleted: {
    backgroundColor: colors.success + "10",
  },
  setText: {
    ...typography.body,
    color: colors.text,
    textAlign: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
});

