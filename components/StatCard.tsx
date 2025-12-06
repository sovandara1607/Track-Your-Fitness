

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, borderRadius, typography } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
}

export function StatCard({ icon, value, label, color = colors.primary }: StatCardProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    minWidth: 100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  value: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});

