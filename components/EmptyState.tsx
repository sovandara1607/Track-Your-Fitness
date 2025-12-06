

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: spacing.lg,
  },
});

