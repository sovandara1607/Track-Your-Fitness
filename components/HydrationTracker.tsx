import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
   Animated,
   Dimensions,
   Modal,
   Platform,
   ScrollView,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Water emojis for falling effect
const WATER_EMOJIS = ["💧", "💦", "🌊", "💙", "🫧", "🧊", "🚿"];
const NUM_FALLING_EMOJIS = 20;

// Storage key
const HYDRATION_STORAGE_KEY = "@hydration_data";

// Glass sizes in ml
const GLASS_SIZES = [
  { label: "Small", ml: 150, icon: "water-outline" as const },
  { label: "Medium", ml: 250, icon: "water" as const },
  { label: "Large", ml: 350, icon: "water" as const },
  { label: "Bottle", ml: 500, icon: "flask" as const },
];

// Daily goal options in ml
const GOAL_OPTIONS = [1500, 2000, 2500, 3000, 3500, 4000];

// Reminder intervals in minutes
const REMINDER_INTERVALS = [
  { label: "15 min", minutes: 15 },
  { label: "30 min", minutes: 30 },
  { label: "45 min", minutes: 45 },
  { label: "1 hour", minutes: 60 },
  { label: "2 hours", minutes: 120 },
];

interface HydrationEntry {
  id: string;
  amount: number;
  timestamp: number;
}

interface HydrationData {
  entries: HydrationEntry[];
  dailyGoal: number;
  lastReminderSet: number | null;
  reminderInterval: number; // in minutes
}

interface HydrationTrackerProps {
  showReminders?: boolean;
}

export function HydrationTracker({ showReminders = true }: HydrationTrackerProps) {
  const { colors, accentColor } = useSettings();
  const [data, setData] = useState<HydrationData>({
    entries: [],
    dailyGoal: 2000,
    lastReminderSet: null,
    reminderInterval: 60,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const waveAnim = useRef(new Animated.Value(0)).current;
  const celebrateAnim = useRef(new Animated.Value(0)).current;
  const [showCelebration, setShowCelebration] = useState(false);
  
  // Falling water emojis animation
  const fallingEmojis = useRef(
    Array.from({ length: NUM_FALLING_EMOJIS }, () => ({
      translateY: new Animated.Value(-100),
      translateX: Math.random() * SCREEN_WIDTH,
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      emoji: WATER_EMOJIS[Math.floor(Math.random() * WATER_EMOJIS.length)],
      size: 20 + Math.random() * 20,
      delay: Math.random() * 1000,
    }))
  ).current;

  // Load data from storage
  useEffect(() => {
    loadData();
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    saveData();
  }, [data]);

  // Wave animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [waveAnim]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(HYDRATION_STORAGE_KEY);
      if (stored) {
        const parsed: HydrationData = JSON.parse(stored);
        // Filter entries to only include today's
        const today = new Date().setHours(0, 0, 0, 0);
        const todayEntries = parsed.entries.filter(
          (entry) => new Date(entry.timestamp).setHours(0, 0, 0, 0) === today
        );
        setData({
          ...parsed,
          entries: todayEntries,
        });
      }
    } catch (error) {
      console.log("Error loading hydration data:", error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(HYDRATION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.log("Error saving hydration data:", error);
    }
  };

  const getTodayTotal = useCallback(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return data.entries
      .filter((entry) => new Date(entry.timestamp).setHours(0, 0, 0, 0) === today)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }, [data.entries]);

  const getProgress = useCallback(() => {
    const total = getTodayTotal();
    return Math.min(total / data.dailyGoal, 1);
  }, [getTodayTotal, data.dailyGoal]);

  const handleAddWater = (amount: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const newEntry: HydrationEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: Date.now(),
    };

    const newEntries = [...data.entries, newEntry];
    setData((prev) => ({ ...prev, entries: newEntries }));

    // Check if goal reached
    const newTotal = getTodayTotal() + amount;
    if (newTotal >= data.dailyGoal && getTodayTotal() < data.dailyGoal) {
      triggerCelebration();
    }
  };

  const handleRemoveEntry = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setData((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== id),
    }));
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Reset and start falling emoji animations
    fallingEmojis.forEach((emoji) => {
      emoji.translateY.setValue(-100);
      emoji.opacity.setValue(1);
      emoji.rotate.setValue(0);
    });

    // Animate each falling emoji with staggered delays
    const fallingAnimations = fallingEmojis.map((emoji) =>
      Animated.sequence([
        Animated.delay(emoji.delay),
        Animated.parallel([
          Animated.timing(emoji.translateY, {
            toValue: SCREEN_HEIGHT + 100,
            duration: 2500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(emoji.rotate, {
            toValue: 360,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(2000),
            Animated.timing(emoji.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );

    // Run falling emojis and celebration overlay together
    Animated.parallel([
      Animated.sequence([
        Animated.timing(celebrateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(celebrateAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      ...fallingAnimations,
    ]).start(() => {
      setShowCelebration(false);
      // Reset hydration entries after goal reached
      setData((prev) => ({
        ...prev,
        entries: [],
      }));
    });
  };

  const setReminder = async () => {
    if (!showReminders) return;
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      // Cancel existing reminders
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Schedule new reminder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💧 Hydration Reminder",
          body: "Time to drink some water! Stay hydrated during your workout.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: data.reminderInterval * 60,
          repeats: true,
        },
      });

      setData((prev) => ({ ...prev, lastReminderSet: Date.now() }));
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log("Error setting reminder:", error);
    }
  };

  const cancelReminder = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setData((prev) => ({ ...prev, lastReminderSet: null }));
    } catch (error) {
      console.log("Error canceling reminder:", error);
    }
  };

  const formatMl = (ml: number) => {
    if (ml >= 1000) {
      return `${(ml / 1000).toFixed(1)}L`;
    }
    return `${ml}ml`;
  };

  const progress = getProgress();
  const todayTotal = getTodayTotal();

  const waveTranslate = waveAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  // Minimized view
  if (!isExpanded) {
    return (
      <TouchableOpacity
        style={[styles.minimizedContainer, { backgroundColor: colors.surface }]}
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.8}
      >
        <View style={styles.minimizedLeft}>
          <View style={[styles.waterIconContainer, { backgroundColor: "#4FC3F7" + "20" }]}>
            <Ionicons name="water" size={20} color="#4FC3F7" />
          </View>
          <View style={styles.minimizedInfo}>
            <Text style={[styles.minimizedTitle, { color: colors.text }]}>Hydration</Text>
            <View style={[styles.miniProgressBar, { backgroundColor: colors.background }]}>
              <View 
                style={[
                  styles.miniProgressFill, 
                  { 
                    width: `${progress * 100}%`, 
                    backgroundColor: progress >= 1 ? staticColors.success : "#4FC3F7",
                  }
                ]} 
              />
            </View>
          </View>
        </View>
        <View style={styles.minimizedRight}>
          <Text style={[styles.minimizedAmount, { color: colors.text }]}>
            {formatMl(todayTotal)}
          </Text>
          <Text style={[styles.minimizedGoal, { color: colors.textSecondary }]}>
            / {formatMl(data.dailyGoal)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Expanded view
  return (
    <>
      <View style={[styles.expandedContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.expandedHeader}>
          <Text style={[styles.expandedTitle, { color: colors.text }]}>Hydration Tracker</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => setShowSettings(true)}>
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsExpanded(false)}>
              <Ionicons name="chevron-up" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Display */}
        <View style={styles.progressSection}>
          <Animated.View 
            style={[
              styles.waterGlass,
              { backgroundColor: colors.background },
            ]}
          >
            <Animated.View 
              style={[
                styles.waterFill,
                { 
                  height: `${progress * 100}%`,
                  backgroundColor: progress >= 1 ? staticColors.success : "#4FC3F7",
                  transform: [{ translateY: waveTranslate }],
                },
              ]}
            />
            <View style={styles.waterGlassOverlay}>
              <Ionicons 
                name={progress >= 1 ? "checkmark-circle" : "water"} 
                size={32} 
                color={progress >= 0.5 ? "#FFFFFF" : colors.textMuted} 
              />
            </View>
          </Animated.View>
          
          <View style={styles.progressInfo}>
            <Text style={[styles.progressAmount, { color: colors.text }]}>
              {formatMl(todayTotal)}
            </Text>
            <Text style={[styles.progressGoal, { color: colors.textSecondary }]}>
              of {formatMl(data.dailyGoal)} goal
            </Text>
            <Text style={[styles.progressPercent, { color: progress >= 1 ? staticColors.success : "#4FC3F7" }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        </View>

        {/* Quick Add Buttons */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Quick Add</Text>
        <View style={styles.quickAddRow}>
          {GLASS_SIZES.map((glass) => (
            <TouchableOpacity
              key={glass.ml}
              style={[styles.quickAddButton, { backgroundColor: colors.background }]}
              onPress={() => handleAddWater(glass.ml)}
              activeOpacity={0.7}
            >
              <Ionicons name={glass.icon} size={24} color="#4FC3F7" />
              <Text style={[styles.quickAddAmount, { color: colors.text }]}>{glass.ml}ml</Text>
              <Text style={[styles.quickAddLabel, { color: colors.textMuted }]}>{glass.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Log */}
        {data.entries.length > 0 && (
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: colors.background }]}
            onPress={() => setShowHistory(true)}
          >
            <Ionicons name="list" size={20} color={colors.textSecondary} />
            <Text style={[styles.historyButtonText, { color: colors.textSecondary }]}>
              View today's log ({data.entries.length} entries)
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Reminder Button */}
        {showReminders && (
          <TouchableOpacity
            style={[
              styles.reminderButton,
              { 
                backgroundColor: data.lastReminderSet ? staticColors.success + "20" : colors.background,
                borderColor: data.lastReminderSet ? staticColors.success : "transparent",
              },
            ]}
            onPress={data.lastReminderSet ? cancelReminder : setReminder}
          >
            <Ionicons 
              name={data.lastReminderSet ? "notifications" : "notifications-outline"} 
              size={20} 
              color={data.lastReminderSet ? staticColors.success : colors.textSecondary} 
            />
            <Text 
              style={[
                styles.reminderButtonText, 
                { color: data.lastReminderSet ? staticColors.success : colors.textSecondary }
              ]}
            >
              {data.lastReminderSet 
                ? `Reminder active (every ${data.reminderInterval} min)` 
                : "Set hydration reminder"}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reset Button */}
        {data.entries.length > 0 && (
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.background }]}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }
              setData((prev) => ({ ...prev, entries: [] }));
            }}
          >
            <Ionicons name="refresh" size={20} color={staticColors.error} />
            <Text style={[styles.resetButtonText, { color: staticColors.error }]}>
              Reset Today's Water
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Celebration Overlay */}
      {showCelebration && (
        <Animated.View 
          style={[
            styles.celebrationOverlay,
            { opacity: celebrateAnim },
          ]}
        >
          {/* Falling Water Emojis */}
          {fallingEmojis.map((emoji, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.fallingEmoji,
                {
                  left: emoji.translateX,
                  fontSize: emoji.size,
                  transform: [
                    { translateY: emoji.translateY },
                    {
                      rotate: emoji.rotate.interpolate({
                        inputRange: [0, 360],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                  opacity: emoji.opacity,
                },
              ]}
            >
              {emoji.emoji}
            </Animated.Text>
          ))}

          <Animated.View 
            style={[
              styles.celebrationContent,
              { 
                backgroundColor: colors.surface,
                transform: [{ scale: celebrateAnim }],
              },
            ]}
          >
            <Text style={styles.celebrationEmoji}>🎉💧</Text>
            <Text style={[styles.celebrationText, { color: colors.text }]}>
              Goal Reached!
            </Text>
            <Text style={[styles.celebrationSubtext, { color: colors.textSecondary }]}>
              Great job staying hydrated!
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Hydration Settings</Text>
            
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Daily Goal</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
              {GOAL_OPTIONS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalOption,
                    { backgroundColor: colors.background },
                    data.dailyGoal === goal && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => setData((prev) => ({ ...prev, dailyGoal: goal }))}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      { color: colors.text },
                      data.dailyGoal === goal && { color: "#FFFFFF" },
                    ]}
                  >
                    {formatMl(goal)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {showReminders && (
              <>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Reminder Interval</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
                  {REMINDER_INTERVALS.map((interval) => (
                    <TouchableOpacity
                      key={interval.minutes}
                      style={[
                        styles.goalOption,
                        { backgroundColor: colors.background },
                        data.reminderInterval === interval.minutes && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      onPress={() => setData((prev) => ({ ...prev, reminderInterval: interval.minutes }))}
                    >
                      <Text
                        style={[
                          styles.goalOptionText,
                          { color: colors.text },
                          data.reminderInterval === interval.minutes && { color: "#FFFFFF" },
                        ]}
                      >
                        {interval.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal
        visible={showHistory}
        transparent
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.historyModalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.historyHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Today's Log</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.historyList}>
              {data.entries.slice().reverse().map((entry) => (
                <View 
                  key={entry.id} 
                  style={[styles.historyItem, { backgroundColor: colors.background }]}
                >
                  <View style={styles.historyItemLeft}>
                    <Ionicons name="water" size={20} color="#4FC3F7" />
                    <View>
                      <Text style={[styles.historyItemAmount, { color: colors.text }]}>
                        {formatMl(entry.amount)}
                      </Text>
                      <Text style={[styles.historyItemTime, { color: colors.textMuted }]}>
                        {new Date(entry.timestamp).toLocaleTimeString([], { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveEntry(entry.id)}>
                    <Ionicons name="trash-outline" size={20} color={staticColors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  minimizedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  minimizedLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  waterIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  minimizedRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  minimizedAmount: {
    ...typography.h3,
    fontWeight: "700",
  },
  minimizedGoal: {
    ...typography.caption,
    marginLeft: 2,
  },
  expandedContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  expandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  expandedTitle: {
    ...typography.h3,
  },
  headerButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  waterGlass: {
    width: 80,
    height: 100,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginRight: spacing.lg,
    justifyContent: "flex-end",
  },
  waterFill: {
    width: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  waterGlassOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  progressInfo: {
    flex: 1,
  },
  progressAmount: {
    fontSize: 32,
    fontWeight: "700",
  },
  progressGoal: {
    ...typography.body,
    marginTop: 2,
  },
  progressPercent: {
    ...typography.h3,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  quickAddRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickAddButton: {
    flex: 1,
    alignItems: "center",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  quickAddAmount: {
    ...typography.caption,
    fontWeight: "700",
    marginTop: 4,
  },
  quickAddLabel: {
    fontSize: 10,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  historyButtonText: {
    ...typography.caption,
    flex: 1,
    marginLeft: spacing.sm,
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  reminderButtonText: {
    ...typography.caption,
    marginLeft: spacing.sm,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  resetButtonText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    fontWeight: "600",
  },
  celebrationOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fallingEmoji: {
    position: "absolute",
    top: 0,
  },
  celebrationContent: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  celebrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  celebrationText: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  celebrationSubtext: {
    ...typography.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  modalLabel: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  goalScroll: {
    marginBottom: spacing.lg,
  },
  goalOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  goalOptionText: {
    ...typography.body,
    fontWeight: "600",
  },
  modalCloseButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalCloseText: {
    ...typography.body,
    fontWeight: "600",
  },
  historyModalContent: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  historyItemAmount: {
    ...typography.body,
    fontWeight: "600",
  },
  historyItemTime: {
    ...typography.caption,
  },
});
