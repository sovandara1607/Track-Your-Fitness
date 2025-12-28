

import { AnimatedBackground } from "@/components/AnimatedBackground";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { getShownAchievements, markAchievementShown } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// Achievement definitions
type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  check: (stats: { totalWorkouts: number; currentStreak: number; totalMinutes: number }, prCount: number) => boolean;
};

const ACHIEVEMENTS: Achievement[] = [
  { id: "first_step", title: "First Step", description: "Complete your first workout", icon: "star", color: staticColors.secondary, check: (s) => s.totalWorkouts >= 1 },
  { id: "on_fire", title: "On Fire", description: "Complete 10 workouts", icon: "flame", color: "#FF6B35", check: (s) => s.totalWorkouts >= 10 },
  { id: "dedicated", title: "Dedicated", description: "Complete 25 workouts", icon: "medal", color: "#9B59B6", check: (s) => s.totalWorkouts >= 25 },
  { id: "beast_mode", title: "Beast Mode", description: "Complete 50 workouts", icon: "fitness", color: "#E74C3C", check: (s) => s.totalWorkouts >= 50 },
  { id: "centurion", title: "Centurion", description: "Complete 100 workouts", icon: "diamond", color: staticColors.secondary, check: (s) => s.totalWorkouts >= 100 },
  { id: "hat_trick", title: "Hat Trick", description: "Achieve a 3-day streak", icon: "trending-up", color: "#3498DB", check: (s) => s.currentStreak >= 3 },
  { id: "week_warrior", title: "Week Warrior", description: "Achieve a 7-day streak", icon: "calendar", color: staticColors.accent, check: (s) => s.currentStreak >= 7 },
  { id: "unstoppable", title: "Unstoppable", description: "Achieve a 14-day streak", icon: "rocket", color: "#E67E22", check: (s) => s.currentStreak >= 14 },
  { id: "iron_will", title: "Iron Will", description: "Achieve a 30-day streak", icon: "shield-checkmark", color: staticColors.secondary, check: (s) => s.currentStreak >= 30 },
  { id: "hour_power", title: "Hour Power", description: "Train for 60 minutes total", icon: "time", color: "#1ABC9C", check: (s) => s.totalMinutes >= 60 },
  { id: "time_lord", title: "Time Lord", description: "Train for 5 hours total", icon: "hourglass", color: "#2ECC71", check: (s) => s.totalMinutes >= 300 },
  { id: "marathon", title: "Marathon", description: "Train for 16+ hours total", icon: "infinite", color: "#F39C12", check: (s) => s.totalMinutes >= 1000 },
  { id: "first_pr", title: "First PR", description: "Set your first personal record", icon: "trophy", color: "#F1C40F", check: (_, pr) => pr >= 1 },
  { id: "record_breaker", title: "Record Breaker", description: "Set 5 personal records", icon: "podium", color: "#C0392B", check: (_, pr) => pr >= 5 },
  { id: "pr_legend", title: "PR Legend", description: "Set 10 personal records", icon: "ribbon", color: staticColors.secondary, check: (_, pr) => pr >= 10 },
];

export default function ProgressScreen() {
  const { user } = useAuth();
  const { preferences, accentColor, colors } = useSettings();
  const stats = useQuery(api.workouts.getStats, user ? { userId: user.id } : "skip");
  const personalRecords = useQuery(api.exercises.getPersonalRecords, user ? { userId: user.id } : "skip");
  const workouts = useQuery(api.workouts.list, user ? { userId: user.id } : "skip");
  const templates = useQuery(api.templates.list, user ? { userId: user.id } : "skip");

  // Achievement popup state
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [shownAchievements, setShownAchievements] = useState<string[]>([]);
  const popupScale = useRef(new Animated.Value(0)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  // Load shown achievements on mount
  useEffect(() => {
    getShownAchievements().then(setShownAchievements);
  }, []);

  // Filter out cardio from PR count
  const filteredRecords = React.useMemo(() => {
    if (!personalRecords || !templates) return [];
    return personalRecords.filter((record) => {
      const template = templates.find((t) => t.name === record.exerciseName);
      return template?.category !== "cardio";
    });
  }, [personalRecords, templates]);

  // Check for new achievements
  useEffect(() => {
    if (!stats || shownAchievements.length === 0 && !stats) return;

    const statsData = {
      totalWorkouts: stats.totalWorkouts ?? 0,
      currentStreak: stats.currentStreak ?? 0,
      totalMinutes: stats.totalMinutes ?? 0,
    };
    const prCount = filteredRecords.length;

    // Find first unlocked but not shown achievement
    for (const achievement of ACHIEVEMENTS) {
      const isUnlocked = achievement.check(statsData, prCount);
      const hasBeenShown = shownAchievements.includes(achievement.id);

      if (isUnlocked && !hasBeenShown) {
        showAchievementNotification(achievement);
        break;
      }
    }
  }, [stats, filteredRecords, shownAchievements]);

  const showAchievementNotification = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement);
    setShowAchievementPopup(true);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Animate popup
    Animated.parallel([
      Animated.spring(popupScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animation
    confettiAnims.forEach((anim, index) => {
      const startX = Math.random() * 300 - 150;
      anim.translateX.setValue(startX);
      anim.translateY.setValue(-50);
      anim.opacity.setValue(1);

      Animated.parallel([
        Animated.timing(anim.translateY, {
          toValue: 400,
          duration: 2000 + Math.random() * 1000,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateX, {
          toValue: startX + (Math.random() * 100 - 50),
          duration: 2000,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotate, {
          toValue: Math.random() * 10 - 5,
          duration: 2000,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    });

    // Mark as shown
    markAchievementShown(achievement.id);
    setShownAchievements((prev) => [...prev, achievement.id]);
  }, [popupScale, popupOpacity, confettiAnims]);

  const closeAchievementPopup = useCallback(() => {
    Animated.parallel([
      Animated.timing(popupScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAchievementPopup(false);
      setCurrentAchievement(null);
    });
  }, [popupScale, popupOpacity]);

  // Helper function to convert weight based on preference
  const displayWeight = (weightInLbs: number) => {
    if (preferences.weightUnit === "kg") {
      return Math.round(weightInLbs * 0.453592);
    }
    return weightInLbs;
  };

  // Helper to get exercise category from templates
  const getExerciseCategory = (exerciseName: string) => {
    const template = templates?.find((t) => t.name === exerciseName);
    return template?.category || "chest";
  };

  const isTimedExercise = (exerciseName: string) => {
    const name = exerciseName.toLowerCase();
    return name.includes("plank") || name.includes("hold") || name.includes("wall sit");
  };

  // Filter only cardio exercises for cardio records
  const cardioRecords = React.useMemo(() => {
    if (!personalRecords) return [];
    return personalRecords.filter((record) => {
      const category = getExerciseCategory(record.exerciseName);
      return category === "cardio";
    });
  }, [personalRecords, templates]);

  // Calculate weekly activity
  const weeklyActivity = React.useMemo(() => {
    if (!workouts) return Array(7).fill(0);

    const now = Date.now();
    const activity = Array(7).fill(0);

    workouts.forEach((workout) => {
      if (workout.completed) {
        const daysAgo = Math.floor((now - workout.date) / (24 * 60 * 60 * 1000));
        if (daysAgo >= 0 && daysAgo < 7) {
          activity[6 - daysAgo] = Math.min(activity[6 - daysAgo] + 1, 3);
        }
      }
    });

    return activity;
  }, [workouts]);

  // Generate day labels dynamically based on current day
  const dayLabels = React.useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    const labels = [];
    
    // Start from 6 days ago and go to today
    for (let i = 6; i >= 0; i--) {
      const dayIndex = (today - i + 7) % 7;
      labels.push(days[dayIndex]);
    }
    
    return labels;
  }, []);

  // Share achievements
  const handleShareStats = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const totalWorkouts = stats?.totalWorkouts ?? 0;
    const totalMinutes = stats?.totalMinutes ?? 0;
    const streak = stats?.currentStreak ?? 0;

    const message = `🏋️ My Fitness Journey Update!\n\n` +
      `💪 ${totalWorkouts} workouts completed\n` +
      `⏱️ ${totalMinutes} total minutes trained\n` +
      `🔥 ${streak} day streak\n\n` +
      `#FitnessGoals #WorkoutTracker`;

    try {
      await Share.share({
        message,
        title: "My Fitness Stats",
      });
    } catch {
      Alert.alert("Error", "Could not share stats");
    }
  };

  // Share personal record
  const handleShareRecord = async (exerciseName: string, weight: number, reps: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const message = `🏆 New Personal Record!\n\n` +
      `Exercise: ${exerciseName}\n` +
      `${weight > 0 ? `Weight: ${displayWeight(weight)} ${preferences.weightUnit}\n` : ""}` +
      `Reps: ${reps}\n\n` +
      `#PersonalBest #FitnessGoals`;

    try {
      await Share.share({
        message,
        title: "Personal Record",
      });
    } catch {
      Alert.alert("Error", "Could not share record");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <AnimatedBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Progress</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your fitness journey</Text>
          </View>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.surface }]}
            onPress={handleShareStats}
          >
            <Ionicons name="share-social-outline" size={22} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* Weekly Activity */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
          <View style={[styles.activityCard, { backgroundColor: colors.surface }]}>
            <View style={styles.activityGrid}>
              {weeklyActivity.map((level, index) => (
                <View key={index} style={styles.activityDay}>
                  <View
                    style={[
                      styles.activityBar,
                      {
                        height: level === 0 ? 8 : 20 + level * 20,
                        backgroundColor:
                          level === 0
                            ? colors.surfaceLight
                            : level === 1
                            ? accentColor + "60"
                            : level === 2
                            ? accentColor + "90"
                            : accentColor,
                      },
                    ]}
                  />
                  <Text style={[styles.activityLabel, { color: colors.textMuted }]}>{dayLabels[index]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="flame"
              value={stats?.currentStreak ?? 0}
              label="Day Streak"
              color={staticColors.secondary}
            />
            <StatCard
              icon="trophy"
              value={stats?.totalWorkouts ?? 0}
              label="Workouts"
              color={accentColor}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              icon="time"
              value={stats?.totalMinutes ?? 0}
              label="Total Minutes"
              color={staticColors.accent}
            />
            <StatCard
              icon="calendar"
              value={stats?.thisWeekWorkouts ?? 0}
              label="This Week"
              color="#5856D6"
            />
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Records 🏆</Text>
            {filteredRecords.length > 0 && (
              <Text style={[styles.recordCount, { color: colors.textSecondary }]}>
                {filteredRecords.length} exercises
              </Text>
            )}
          </View>
          {personalRecords === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon="trophy-outline"
              title="No Records Yet"
              description="Complete workouts to set your personal records"
            />
          ) : (
            <View style={styles.recordsGrid}>
              {filteredRecords.map((record) => {
                const isTimed = isTimedExercise(record.exerciseName);
                const repsLabel = isTimed ? "sec" : "reps";
                
                return (
                  <TouchableOpacity
                    key={record._id}
                    style={[styles.recordCard, { backgroundColor: colors.surface }]}
                    onLongPress={() => handleShareRecord(record.exerciseName, record.maxWeight, record.maxReps)}
                    delayLongPress={400}
                    activeOpacity={0.8}
                  >
                    <View style={styles.recordHeader}>
                      <Ionicons name="medal" size={20} color={staticColors.secondary} />
                      <Text style={[styles.recordName, { color: colors.text }]} numberOfLines={1}>
                        {record.exerciseName}
                      </Text>
                    </View>
                    <View style={styles.recordStats}>
                      {record.maxWeight > 0 ? (
                        <>
                          <View style={styles.recordStat}>
                            <Text style={[styles.recordValue, { color: colors.text }]}>{displayWeight(record.maxWeight)}</Text>
                            <Text style={[styles.recordLabel, { color: colors.textMuted }]}>{preferences.weightUnit}</Text>
                          </View>
                          <View style={[styles.recordDivider, { backgroundColor: colors.surfaceLight }]} />
                          <View style={styles.recordStat}>
                            <Text style={[styles.recordValue, { color: colors.text }]}>{record.maxReps}</Text>
                            <Text style={[styles.recordLabel, { color: colors.textMuted }]}>{repsLabel}</Text>
                          </View>
                        </>
                      ) : (
                        <View style={[styles.recordStat, { flex: 1 }]}>
                          <Text style={[styles.recordValue, { color: colors.text }]}>{record.maxReps}</Text>
                          <Text style={[styles.recordLabel, { color: colors.textMuted }]}>{repsLabel} (BW)</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.shareHint}>
                      <Ionicons name="share-outline" size={12} color={colors.textMuted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Cardio Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cardio Records 🏃</Text>
            {cardioRecords.length > 0 && (
              <Text style={[styles.recordCount, { color: colors.textSecondary }]}>
                {cardioRecords.length} exercises
              </Text>
            )}
          </View>
          {personalRecords === undefined ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : cardioRecords.length === 0 ? (
            <EmptyState
              icon="bicycle-outline"
              title="No Cardio Records"
              description="Complete cardio workouts to track your best times"
            />
          ) : (
            <View style={styles.recordsGrid}>
              {cardioRecords.map((record) => (
                <View key={record._id} style={[styles.recordCard, { backgroundColor: colors.surface }]}>
                  <View style={styles.recordHeader}>
                    <Ionicons name="stopwatch" size={20} color={staticColors.accent} />
                    <Text style={[styles.recordName, { color: colors.text }]} numberOfLines={1}>
                      {record.exerciseName}
                    </Text>
                  </View>
                  <View style={styles.recordStats}>
                    <View style={[styles.recordStat, { flex: 1 }]}>
                      <Text style={[styles.recordValue, { color: colors.text }]}>{record.maxReps}</Text>
                      <Text style={[styles.recordLabel, { color: colors.textMuted }]}>min best</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Achievements</Text>
            <Text style={[styles.recordCount, { color: colors.textSecondary }]}>
              {[
                (stats?.totalWorkouts ?? 0) >= 1,
                (stats?.totalWorkouts ?? 0) >= 10,
                (stats?.totalWorkouts ?? 0) >= 25,
                (stats?.totalWorkouts ?? 0) >= 50,
                (stats?.totalWorkouts ?? 0) >= 100,
                (stats?.currentStreak ?? 0) >= 3,
                (stats?.currentStreak ?? 0) >= 7,
                (stats?.currentStreak ?? 0) >= 14,
                (stats?.currentStreak ?? 0) >= 30,
                (stats?.totalMinutes ?? 0) >= 60,
                (stats?.totalMinutes ?? 0) >= 300,
                (stats?.totalMinutes ?? 0) >= 1000,
                (filteredRecords?.length ?? 0) >= 1,
                (filteredRecords?.length ?? 0) >= 5,
                (filteredRecords?.length ?? 0) >= 10,
              ].filter(Boolean).length}/15 unlocked
            </Text>
          </View>
          
          {/* Row 1: Workout Count Achievements */}
          <Text style={[styles.achievementCategory, { color: colors.textSecondary }]}>💪 Workout Milestones</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 1 && [styles.achievementUnlocked, { borderColor: staticColors.secondary + "40" }],
              ]}
            >
              <Ionicons
                name="star"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 1 ? staticColors.secondary : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>First Step</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>1 workout</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 10 && [styles.achievementUnlocked, { borderColor: accentColor + "40" }],
              ]}
            >
              <Ionicons
                name="flame"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 10 ? accentColor : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>On Fire</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>10 workouts</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 25 && [styles.achievementUnlocked, { borderColor: "#9B59B6" + "40" }],
              ]}
            >
              <Ionicons
                name="medal"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 25 ? "#9B59B6" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Dedicated</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>25 workouts</Text>
            </View>
          </View>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 50 && [styles.achievementUnlocked, { borderColor: "#E74C3C" + "40" }],
              ]}
            >
              <Ionicons
                name="fitness"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 50 ? "#E74C3C" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Beast Mode</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>50 workouts</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalWorkouts ?? 0) >= 100 && [styles.achievementUnlocked, { borderColor: staticColors.secondary + "40" }],
              ]}
            >
              <Ionicons
                name="diamond"
                size={32}
                color={(stats?.totalWorkouts ?? 0) >= 100 ? staticColors.secondary : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Centurion</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>100 workouts</Text>
            </View>
            <View style={[styles.achievementCard, { backgroundColor: "transparent" }]} />
          </View>

          {/* Row 2: Streak Achievements */}
          <Text style={[styles.achievementCategory, { color: colors.textSecondary }]}>🔥 Streak Masters</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.currentStreak ?? 0) >= 3 && [styles.achievementUnlocked, { borderColor: "#3498DB" + "40" }],
              ]}
            >
              <Ionicons
                name="trending-up"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 3 ? "#3498DB" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Hat Trick</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>3 day streak</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.currentStreak ?? 0) >= 7 && [styles.achievementUnlocked, { borderColor: staticColors.accent + "40" }],
              ]}
            >
              <Ionicons
                name="calendar"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 7 ? staticColors.accent : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Week Warrior</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>7 day streak</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.currentStreak ?? 0) >= 14 && [styles.achievementUnlocked, { borderColor: "#E67E22" + "40" }],
              ]}
            >
              <Ionicons
                name="rocket"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 14 ? "#E67E22" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Unstoppable</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>14 day streak</Text>
            </View>
          </View>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.currentStreak ?? 0) >= 30 && [styles.achievementUnlocked, { borderColor: staticColors.secondary + "40" }],
              ]}
            >
              <Ionicons
                name="shield-checkmark"
                size={32}
                color={(stats?.currentStreak ?? 0) >= 30 ? staticColors.secondary : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Iron Will</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>30 day streak</Text>
            </View>
            <View style={[styles.achievementCard, { backgroundColor: "transparent" }]} />
            <View style={[styles.achievementCard, { backgroundColor: "transparent" }]} />
          </View>

          {/* Row 3: Time Achievements */}
          <Text style={[styles.achievementCategory, { color: colors.textSecondary }]}>⏱️ Time Invested</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalMinutes ?? 0) >= 60 && [styles.achievementUnlocked, { borderColor: "#1ABC9C" + "40" }],
              ]}
            >
              <Ionicons
                name="time"
                size={32}
                color={(stats?.totalMinutes ?? 0) >= 60 ? "#1ABC9C" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Hour Power</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>60 min total</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalMinutes ?? 0) >= 300 && [styles.achievementUnlocked, { borderColor: "#2ECC71" + "40" }],
              ]}
            >
              <Ionicons
                name="hourglass"
                size={32}
                color={(stats?.totalMinutes ?? 0) >= 300 ? "#2ECC71" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Time Lord</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>5 hours total</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (stats?.totalMinutes ?? 0) >= 1000 && [styles.achievementUnlocked, { borderColor: "#F39C12" + "40" }],
              ]}
            >
              <Ionicons
                name="infinite"
                size={32}
                color={(stats?.totalMinutes ?? 0) >= 1000 ? "#F39C12" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Marathon</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>16+ hours</Text>
            </View>
          </View>

          {/* Row 4: PR Achievements */}
          <Text style={[styles.achievementCategory, { color: colors.textSecondary }]}>🏆 Personal Records</Text>
          <View style={styles.achievementsGrid}>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (filteredRecords?.length ?? 0) >= 1 && [styles.achievementUnlocked, { borderColor: "#F1C40F" + "40" }],
              ]}
            >
              <Ionicons
                name="trophy"
                size={32}
                color={(filteredRecords?.length ?? 0) >= 1 ? "#F1C40F" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>First PR</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>1 record</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (filteredRecords?.length ?? 0) >= 5 && [styles.achievementUnlocked, { borderColor: "#C0392B" + "40" }],
              ]}
            >
              <Ionicons
                name="podium"
                size={32}
                color={(filteredRecords?.length ?? 0) >= 5 ? "#C0392B" : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>Record Breaker</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>5 records</Text>
            </View>
            <View
              style={[
                styles.achievementCard,
                { backgroundColor: colors.surface },
                (filteredRecords?.length ?? 0) >= 10 && [styles.achievementUnlocked, { borderColor: staticColors.secondary + "40" }],
              ]}
            >
              <Ionicons
                name="ribbon"
                size={32}
                color={(filteredRecords?.length ?? 0) >= 10 ? staticColors.secondary : colors.textMuted}
              />
              <Text style={[styles.achievementTitle, { color: colors.text }]}>PR Legend</Text>
              <Text style={[styles.achievementDesc, { color: colors.textMuted }]}>10 records</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Achievement Popup Modal */}
      <Modal
        visible={showAchievementPopup}
        transparent
        animationType="none"
        onRequestClose={closeAchievementPopup}
      >
        <View style={styles.modalOverlay}>
          {/* Confetti */}
          {confettiAnims.map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: [
                    "#FFD700",
                    "#FF6B35",
                    "#4ECDC4",
                    "#FF69B4",
                    "#9B59B6",
                    "#3498DB",
                  ][index % 6],
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { rotate: anim.rotate.interpolate({
                      inputRange: [-5, 5],
                      outputRange: ["-180deg", "180deg"],
                    }) },
                  ],
                  opacity: anim.opacity,
                },
              ]}
            />
          ))}

          <Animated.View
            style={[
              styles.achievementPopup,
              { backgroundColor: colors.surface },
              {
                transform: [{ scale: popupScale }],
                opacity: popupOpacity,
              },
            ]}
          >
            {currentAchievement && (
              <>
                <View
                  style={[
                    styles.achievementIconContainer,
                    { backgroundColor: currentAchievement.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={currentAchievement.icon}
                    size={64}
                    color={currentAchievement.color}
                  />
                </View>
                <Text style={[styles.achievementPopupLabel, { color: currentAchievement.color }]}>
                  🎉 Achievement Unlocked! 🎉
                </Text>
                <Text style={[styles.achievementPopupTitle, { color: colors.text }]}>
                  {currentAchievement.title}
                </Text>
                <Text style={[styles.achievementPopupDesc, { color: colors.textSecondary }]}>
                  {currentAchievement.description}
                </Text>
                <TouchableOpacity
                  style={[styles.achievementPopupButton, { backgroundColor: currentAchievement.color }]}
                  onPress={closeAchievementPopup}
                >
                  <Text style={styles.achievementPopupButtonText}>Awesome!</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  shareHint: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
  },
  recordCount: {
    ...typography.caption,
  },
  activityCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  activityGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
  },
  activityDay: {
    alignItems: "center",
    flex: 1,
  },
  activityBar: {
    width: 24,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  activityLabel: {
    ...typography.small,
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: "center",
  },
  loadingText: {
    ...typography.body,
  },
  recordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  recordCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    width: (width - spacing.lg * 2 - spacing.md) / 2,
  },
  recordHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  recordName: {
    ...typography.caption,
    fontWeight: "600",
    flex: 1,
  },
  recordStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordStat: {
    flex: 1,
    alignItems: "center",
  },
  recordValue: {
    ...typography.h2,
  },
  recordLabel: {
    ...typography.small,
  },
  recordDivider: {
    width: 1,
    height: 30,
  },
  achievementsGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  achievementCategory: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  achievementCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 1,
  },
  achievementTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginTop: spacing.sm,
    textAlign: "center",
  },
  achievementDesc: {
    ...typography.small,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  // Achievement Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  confetti: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 2,
    left: "50%",
    top: 0,
  },
  achievementPopup: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: width * 0.85,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  achievementIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  achievementPopupLabel: {
    ...typography.caption,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  achievementPopupTitle: {
    ...typography.h1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  achievementPopupDesc: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  achievementPopupButton: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 150,
    alignItems: "center",
  },
  achievementPopupButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});

