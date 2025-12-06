

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon,
  style,
}: ButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const containerStyles: ViewStyle[] = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.text : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  container_primary: {
    backgroundColor: colors.primary,
  },
  container_secondary: {
    backgroundColor: colors.surface,
  },
  container_outline: {
    backgroundColor: "transparent"
,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  container_ghost: {
    backgroundColor: "transparent",
  },
  container_small: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  container_medium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  container_large: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
  },
  text_primary: {
    color: colors.text,
  },
  text_secondary: {
    color: colors.text,
  },
  text_outline: {
    color: colors.primary,
  },
  text_ghost: {
    color: colors.primary,
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
});

