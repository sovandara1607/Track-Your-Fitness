import { borderRadius, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WorkoutData {
  date: number;
  duration: number;
  completed: boolean;
  name: string;
}

interface RecoveryRecommendationsProps {
  recentWorkouts?: WorkoutData[];
  userName?: string;
}

// Recovery recommendation types
type RecoveryStatus = "rest" | "light" | "moderate" | "ready";

interface RecoveryInfo {
  status: RecoveryStatus;
  title: string;
  message: string;
  tips: string[];
  insights: string;
  suggestedWorkout?: string;
}

const STATUS_COLORS: Record<RecoveryStatus, string> = {
  rest: "#FF6B6B",
  light: "#FFB347",
  moderate: "#4ECDC4",
  ready: "#00D26A",
};

const STATUS_ICONS: Record<RecoveryStatus, keyof typeof Ionicons.glyphMap> = {
  rest: "bed-outline",
  light: "walk-outline",
  moderate: "fitness-outline",
  ready: "rocket-outline",
};

export function RecoveryRecommendations({ recentWorkouts = [], userName }: RecoveryRecommendationsProps) {
  const { colors, accentColor } = useSettings();
  const getAIRecommendation = useAction(api.ai.getAIRecoveryRecommendation);
  
  const [recommendation, setRecommendation] = useState<RecoveryInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIPowered, setIsAIPowered] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  
  const statusColor = recommendation ? STATUS_COLORS[recommendation.status] : accentColor;
  const statusIcon = recommendation ? STATUS_ICONS[recommendation.status] : "analytics-outline";

  // Fetch AI recommendation
  const fetchRecommendation = useCallback(async () => {
    // Debounce: don't fetch if we fetched in the last 30 seconds
    const now = Date.now();
    if (now - lastFetchTime < 30000 && recommendation) {
      return;
    }
    
    setIsLoading(true);
    fadeAnim.setValue(0);
    
    try {
      const result = await getAIRecommendation({
        workouts: recentWorkouts.map((w) => ({
          name: w.name,
          date: w.date,
          duration: w.duration,
          completed: w.completed,
        })),
        userName,
      });
      
      setRecommendation(result);
      setIsAIPowered(true);
      setLastFetchTime(now);
      
      // Animate in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Failed to get AI recommendation:", error);
      // Use fallback
      setRecommendation(getLocalFallback(recentWorkouts));
      setIsAIPowered(false);
    } finally {
      setIsLoading(false);
    }
  }, [recentWorkouts, userName, getAIRecommendation, lastFetchTime, recommendation, fadeAnim]);

  // Initial fetch
  useEffect(() => {
    fetchRecommendation();
  }, []);
  
  // Refetch when workouts change significantly
  useEffect(() => {
    if (recentWorkouts.length > 0 && !isLoading) {
      const timer = setTimeout(fetchRecommendation, 1000);
      return () => clearTimeout(timer);
    }
  }, [recentWorkouts.length]);

  // Animations
  useEffect(() => {
    if (!recommendation) return;
    
    // Pulse animation for icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // AI sparkle animation
    if (isAIPowered) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    
    // Progress bar animation
    const targetProgress = 
      recommendation.status === "rest" ? 0.9 :
      recommendation.status === "light" ? 0.6 :
      recommendation.status === "moderate" ? 0.35 :
      0.1;
    
    Animated.timing(progressAnim, {
      toValue: targetProgress,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [recommendation, isAIPowered, pulseAnim, progressAnim, sparkleAnim]);

  // Loading state
  if (isLoading && !recommendation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentColor} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            🤖 AI analyzing your workout pattern...
          </Text>
        </View>
      </View>
    );
  }

  if (!recommendation) return null;
  
  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.surface, opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="analytics-outline" size={20} color={accentColor} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recovery Status
          </Text>
          {isAIPowered && (
            <Animated.View 
              style={[
                styles.aiBadge, 
                { 
                  backgroundColor: accentColor + "20",
                  opacity: sparkleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                  }),
                }
              ]}
            >
              <Text style={[styles.aiBadgeText, { color: accentColor }]}>✨ AI</Text>
            </Animated.View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={fetchRecommendation} 
            style={styles.refreshButton}
            disabled={isLoading}
          >
            <Ionicons 
              name="refresh-outline" 
              size={18} 
              color={isLoading ? colors.textMuted : colors.textSecondary} 
            />
          </TouchableOpacity>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {recommendation.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Main Recommendation Card */}
      <View style={[styles.recommendationCard, { backgroundColor: statusColor + "15" }]}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name={statusIcon} size={40} color={statusColor} />
        </Animated.View>
        
        <View style={styles.recommendationContent}>
          <Text style={[styles.recommendationTitle, { color: colors.text }]}>
            {recommendation.title}
          </Text>
          <Text style={[styles.recommendationMessage, { color: colors.textSecondary }]}>
            {recommendation.message}
          </Text>
        </View>
      </View>
      
      {/* AI Insights */}
      {recommendation.insights && (
        <View style={[styles.insightContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.insightLabel, { color: accentColor }]}>💡 Insight</Text>
          <Text style={[styles.insightText, { color: colors.text }]}>
            {recommendation.insights}
          </Text>
        </View>
      )}
      
      {/* Suggested Workout */}
      {recommendation.suggestedWorkout && recommendation.status !== "rest" && (
        <View style={[styles.suggestedContainer, { backgroundColor: statusColor + "10" }]}>
          <Ionicons name="bulb-outline" size={16} color={statusColor} />
          <Text style={[styles.suggestedText, { color: colors.text }]}>
            <Text style={{ fontWeight: "700" }}>Suggested: </Text>
            {recommendation.suggestedWorkout}
          </Text>
        </View>
      )}
      
      {/* Fatigue Meter */}
      <View style={styles.meterContainer}>
        <View style={styles.meterLabels}>
          <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Well Rested</Text>
          <Text style={[styles.meterLabel, { color: colors.textSecondary }]}>Fatigued</Text>
        </View>
        <View style={[styles.meterTrack, { backgroundColor: colors.background }]}>
          <Animated.View 
            style={[
              styles.meterFill, 
              { 
                backgroundColor: statusColor,
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              }
            ]} 
          />
          <View style={styles.meterMarkers}>
            <View style={[styles.meterMarker, { left: "25%" }]} />
            <View style={[styles.meterMarker, { left: "50%" }]} />
            <View style={[styles.meterMarker, { left: "75%" }]} />
          </View>
        </View>
      </View>
      
      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, { color: colors.text }]}>
          📋 Today's Action Plan
        </Text>
        <View style={styles.tipsList}>
          {recommendation.tips.slice(0, 4).map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: statusColor }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// Local fallback when AI is unavailable
function getLocalFallback(workouts: WorkoutData[]): RecoveryInfo {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  let fatigueScore = 0;
  const completedWorkouts = workouts.filter((w) => w.completed);
  
  completedWorkouts.forEach((workout) => {
    const daysAgo = (now - workout.date) / oneDayMs;
    const intensity = workout.duration < 20 ? 25 : workout.duration < 40 ? 50 : workout.duration < 60 ? 75 : 100;
    fatigueScore += intensity * Math.exp(-daysAgo / 2);
  });
  fatigueScore = Math.min(fatigueScore, 100);

  const today = Math.floor(now / oneDayMs);
  const workoutDays = new Set(completedWorkouts.map((w) => Math.floor(w.date / oneDayMs)));
  let consecutiveDays = 0;
  let checkDay = today;
  while (workoutDays.has(checkDay)) {
    consecutiveDays++;
    checkDay--;
  }

  if (fatigueScore > 70 || consecutiveDays >= 3) {
    return {
      status: "rest",
      title: "Rest Day Recommended 😴",
      message: "Your body needs recovery time. Rest is when you get stronger!",
      tips: ["Focus on sleep", "Stay hydrated", "Light stretching only", "Eat protein-rich foods"],
      insights: "Recovery is essential for muscle growth and injury prevention.",
    };
  }

  if (fatigueScore > 45 || consecutiveDays === 2) {
    return {
      status: "light",
      title: "Light Activity Day 🚶",
      message: "Your muscles are still recovering. Keep it easy today.",
      tips: ["Go for a walk", "Try yoga", "Mobility work", "Swimming"],
      insights: "Active recovery promotes blood flow without adding stress.",
      suggestedWorkout: "Yoga or stretching",
    };
  }

  if (completedWorkouts.length > 0 && fatigueScore > 25) {
    return {
      status: "moderate",
      title: "Moderate Training OK 💪",
      message: "You can train, but target different muscle groups.",
      tips: ["Work different muscles", "Keep intensity moderate", "Warm up well", "Listen to your body"],
      insights: "Training variety helps prevent overuse.",
      suggestedWorkout: "Different muscle group workout",
    };
  }

  return {
    status: "ready",
    title: "Ready to Crush It! 🔥",
    message: "You're fully recovered and ready for an intense session!",
    tips: ["Perfect for heavy lifts", "Try HIIT", "Push your limits", "Fuel up properly"],
    insights: "Your body is primed for growth!",
    suggestedWorkout: "Full body or high intensity",
  };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
    textAlign: "center",
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
  sectionTitle: {
    ...typography.h3,
  },
  aiBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  refreshButton: {
    padding: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: "700",
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  recommendationMessage: {
    ...typography.body,
    lineHeight: 20,
  },
  insightContainer: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  insightLabel: {
    ...typography.caption,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  insightText: {
    ...typography.body,
    fontStyle: "italic",
  },
  suggestedContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  suggestedText: {
    ...typography.body,
    flex: 1,
  },
  meterContainer: {
    marginBottom: spacing.md,
  },
  meterLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  meterLabel: {
    ...typography.caption,
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  meterFill: {
    height: "100%",
    borderRadius: 4,
  },
  meterMarkers: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  meterMarker: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tipsContainer: {
    marginTop: spacing.sm,
  },
  tipsTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  tipsList: {
    gap: spacing.xs,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tipText: {
    ...typography.body,
    flex: 1,
  },
});
