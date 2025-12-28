import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WorkoutCardProps {
  name: string;
  date: number;
  duration: number;
  completed: boolean;
  exerciseCount?: number;
  exercisePreview?: string[]; // Array of exercise names to show
  difficulty?: "easy" | "medium" | "hard" | "intense";
  onPress: () => void;
  onDelete?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

// Get time of day based on workout date
const getTimeOfDay = (timestamp: number): { icon: "sunny" | "partly-sunny" | "moon"; label: string; color: string } => {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 12) {
    return { icon: "sunny", label: "Morning", color: "#FFB74D" };
  } else if (hour >= 12 && hour < 17) {
    return { icon: "partly-sunny", label: "Afternoon", color: "#FFA726" };
  } else if (hour >= 17 && hour < 21) {
    return { icon: "partly-sunny", label: "Evening", color: "#FF7043" };
  }
  return { icon: "moon", label: "Night", color: "#7986CB" };
};

// Get difficulty color and label
const getDifficultyInfo = (difficulty: string) => {
  switch (difficulty) {
    case "easy":
      return { color: "#4CAF50", label: "Easy", dots: 1 };
    case "medium":
      return { color: "#FFC107", label: "Medium", dots: 2 };
    case "hard":
      return { color: "#FF9800", label: "Hard", dots: 3 };
    case "intense":
      return { color: "#F44336", label: "Intense", dots: 4 };
    default:
      return { color: "#9E9E9E", label: "Normal", dots: 2 };
  }
};

const SWIPE_THRESHOLD = 50;

export function WorkoutCard({
  name,
  date,
  duration,
  completed,
  exerciseCount = 0,
  exercisePreview = [],
  difficulty,
  onPress,
  onDelete,
  onFavorite,
  isFavorite = false,
}: WorkoutCardProps) {
  const { colors } = useSettings();
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeDirection = useRef<"left" | "right" | null>(null);

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const timeOfDay = getTimeOfDay(date);
  const difficultyInfo = difficulty ? getDifficultyInfo(difficulty) : null;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Make it easier to trigger swipe - lower threshold and be more lenient with vertical movement
        const isHorizontalSwipe = Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
        return isHorizontalSwipe;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Capture gesture if clearly horizontal
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderGrant: () => {
        // Give immediate haptic feedback when swipe starts
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && onFavorite) {
          // Swiping right - favorite
          swipeDirection.current = "right";
          translateX.setValue(Math.min(gestureState.dx, SWIPE_THRESHOLD + 30));
        } else if (gestureState.dx < 0 && onDelete) {
          // Swiping left - delete
          swipeDirection.current = "left";
          translateX.setValue(Math.max(gestureState.dx, -(SWIPE_THRESHOLD + 30)));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > SWIPE_THRESHOLD && onFavorite) {
          // Trigger favorite
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          onFavorite();
        } else if (gestureState.dx < -SWIPE_THRESHOLD && onDelete) {
          // Trigger delete
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          onDelete();
        }
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 200,
          friction: 20,
        }).start();
        swipeDirection.current = null;
      },
    })
  ).current;

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  // Calculate background colors for swipe actions
  const leftActionOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const rightActionOpacity = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.swipeContainer}>
      {/* Left swipe action (Favorite) */}
      {onFavorite && (
        <Animated.View style={[styles.swipeAction, styles.leftAction, { opacity: leftActionOpacity }]}>
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>{isFavorite ? "Unfavorite" : "Favorite"}</Text>
        </Animated.View>
      )}

      {/* Right swipe action (Delete) */}
      {onDelete && (
        <Animated.View style={[styles.swipeAction, styles.rightAction, { opacity: rightActionOpacity }]}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.swipeActionText}>Delete</Text>
        </Animated.View>
      )}

      <Animated.View
        style={[{ transform: [{ translateX }] }]}
        {...(onDelete || onFavorite ? panResponder.panHandlers : {})}
      >
        <TouchableOpacity
          style={[styles.container, { backgroundColor: colors.surface }]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <View style={styles.leftSection}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: completed ? staticColors.success : staticColors.warning },
              ]}
            />
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                {isFavorite && (
                  <Ionicons name="heart" size={16} color={staticColors.error} style={styles.favoriteIcon} />
                )}
                {/* Status Badge */}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: completed ? staticColors.success + "20" : staticColors.warning + "20" }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: completed ? staticColors.success : staticColors.warning }
                  ]}>
                    {completed ? "Completed" : "In Progress"}
                  </Text>
                </View>
              </View>

              {/* Exercise Preview */}
              {exercisePreview.length > 0 && (
                <Text style={[styles.exercisePreview, { color: colors.textMuted }]} numberOfLines={1}>
                  {exercisePreview.slice(0, 3).join(" • ")}
                  {exercisePreview.length > 3 && ` +${exercisePreview.length - 3} more`}
                </Text>
              )}

              <View style={styles.metaRow}>
                {/* Time of day indicator */}
                <View style={styles.metaItem}>
                  <Ionicons name={timeOfDay.icon} size={14} color={timeOfDay.color} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formattedDate}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{duration} min</Text>
                </View>

                {exerciseCount > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{exerciseCount}</Text>
                  </View>
                )}
              </View>

              {/* Difficulty indicator */}
              {difficultyInfo && (
                <View style={styles.difficultyRow}>
                  <View style={styles.difficultyDots}>
                    {[1, 2, 3, 4].map((dot) => (
                      <View
                        key={dot}
                        style={[
                          styles.difficultyDot,
                          {
                            backgroundColor: dot <= difficultyInfo.dots ? difficultyInfo.color : colors.surfaceLight,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.difficultyLabel, { color: difficultyInfo.color }]}>
                    {difficultyInfo.label}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    marginBottom: spacing.sm,
    position: "relative",
  },
  swipeAction: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SWIPE_THRESHOLD + 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.lg,
  },
  leftAction: {
    left: 0,
    backgroundColor: "#FF6B9D", // Pink/magenta for favorite
  },
  rightAction: {
    right: 0,
    backgroundColor: "#F44336",
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 50,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    ...typography.h3,
    marginBottom: 2,
  },
  favoriteIcon: {
    marginLeft: spacing.xs,
  },
  statusBadge: {
    marginLeft: "auto",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  exercisePreview: {
    fontSize: 12,
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
  },
  difficultyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  difficultyDots: {
    flexDirection: "row",
    gap: 3,
  },
  difficultyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  difficultyLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
});

