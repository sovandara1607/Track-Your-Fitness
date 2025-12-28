import { borderRadius, colors, spacing } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";

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
  const { accentColor } = useSettings();

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  // Dynamic styles based on accent color
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return { backgroundColor: accentColor };
      case "outline":
        return { borderColor: accentColor };
      default:
        return {};
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "outline":
      case "ghost":
        return { color: accentColor };
      default:
        return {};
    }
  };

  const containerStyles: ViewStyle[] = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    getContainerStyle(),
    disabled && styles.disabled,
    style,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    getTextStyle(),
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
          color={variant === "primary" ? colors.text : accentColor}
          size="small"
        />
      ) : (
        <>
          {typeof icon === "string" ? <Text>{icon}</Text> : icon}
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
    backgroundColor: "transparent",
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
