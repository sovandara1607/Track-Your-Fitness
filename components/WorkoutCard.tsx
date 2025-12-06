

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

interface WorkoutCardProps {
  name: string;
  date: number;
  duration: number;
  completed: boolean;
  exerciseCount?: number;
  onPress: () => void;
}

export function WorkoutCard({
  name,
  date,
  duration,
  completed,
  exerciseCount = 0,
  onPress,
}: WorkoutCardProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: completed ? colors.success : colors.warning },
          ]}
        />
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{duration} min</Text>
            </View>
            {exerciseCount > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>{exerciseCount}</Text>
              </View>
            )}

          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

