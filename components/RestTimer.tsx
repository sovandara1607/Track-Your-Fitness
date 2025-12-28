import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
   Animated,
   Modal,
   Platform,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from "react-native";

// Preset rest times in seconds
const REST_PRESETS = [
  { label: "30s", seconds: 30 },
  { label: "45s", seconds: 45 },
  { label: "60s", seconds: 60 },
  { label: "90s", seconds: 90 },
  { label: "2m", seconds: 120 },
  { label: "3m", seconds: 180 },
];

interface RestTimerProps {
  onComplete?: () => void;
  autoStart?: boolean;
  defaultSeconds?: number;
}

export function RestTimer({ onComplete, autoStart = false, defaultSeconds = 60 }: RestTimerProps) {
  const { colors, accentColor } = useSettings();
  const [isRunning, setIsRunning] = useState(autoStart);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const [showPicker, setShowPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Play completion sound
  const playCompletionSound = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      
      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
        { shouldPlay: true, volume: 1.0 }
      );
      
      // Unload after playing
      sound.setOnPlaybackStatusUpdate((status: { isLoaded: boolean; didJustFinish?: boolean }) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log("Could not play sound:", error);
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          // Play tick sound at 3, 2, 1
          if (prev <= 4 && prev > 1) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, secondsLeft]);

  // Update progress animation
  useEffect(() => {
    const progress = secondsLeft / totalSeconds;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [secondsLeft, totalSeconds, progressAnim]);

  // Pulse animation when running low
  useEffect(() => {
    if (isRunning && secondsLeft <= 5 && secondsLeft > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, secondsLeft, pulseAnim]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    // Play completion sound
    playCompletionSound();
    
    // Haptic feedback
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    onComplete?.();
  }, [onComplete, playCompletionSound]);

  const handleStartPause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (secondsLeft === 0) {
      setSecondsLeft(totalSeconds);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  };

  const handleSelectPreset = (seconds: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTotalSeconds(seconds);
    setSecondsLeft(seconds);
    setShowPicker(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
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
          <Animated.View 
            style={[
              styles.timerIconContainer, 
              { 
                backgroundColor: isRunning ? accentColor + "20" : colors.background,
                transform: [{ scale: secondsLeft <= 5 && isRunning ? pulseAnim : 1 }],
              }
            ]}
          >
            <Ionicons 
              name="timer-outline" 
              size={20} 
              color={isRunning ? accentColor : colors.textSecondary} 
            />
          </Animated.View>
          <View style={styles.minimizedInfo}>
            <Text style={[styles.minimizedTitle, { color: colors.text }]}>Rest Timer</Text>
            <View style={[styles.miniProgressBar, { backgroundColor: colors.background }]}>
              <Animated.View 
                style={[
                  styles.miniProgressFill, 
                  { 
                    width: progressWidth, 
                    backgroundColor: secondsLeft <= 5 ? staticColors.warning : accentColor,
                  }
                ]} 
              />
            </View>
          </View>
        </View>
        <View style={styles.minimizedRight}>
          <Text 
            style={[
              styles.minimizedTime, 
              { color: secondsLeft <= 5 && isRunning ? staticColors.warning : colors.text }
            ]}
          >
            {formatTime(secondsLeft)}
          </Text>
          <TouchableOpacity
            style={[styles.miniButton, { backgroundColor: isRunning ? staticColors.warning : accentColor }]}
            onPress={(e) => {
              e.stopPropagation();
              handleStartPause();
            }}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // Expanded view
  return (
    <>
      <View style={[styles.expandedContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.expandedHeader}>
          <Text style={[styles.expandedTitle, { color: colors.text }]}>Rest Timer</Text>
          <TouchableOpacity onPress={() => setIsExpanded(false)}>
            <Ionicons name="chevron-up" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Timer Display */}
        <Animated.View 
          style={[
            styles.timerDisplay,
            { transform: [{ scale: secondsLeft <= 5 && isRunning ? pulseAnim : 1 }] },
          ]}
        >
          <Text 
            style={[
              styles.timerText, 
              { color: secondsLeft <= 5 && isRunning ? staticColors.warning : colors.text }
            ]}
          >
            {formatTime(secondsLeft)}
          </Text>
        </Animated.View>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressWidth, 
                backgroundColor: secondsLeft <= 5 ? staticColors.warning : accentColor,
              }
            ]} 
          />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.background }]}
            onPress={handleReset}
          >
            <Ionicons name="refresh" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: isRunning ? staticColors.warning : accentColor }]}
            onPress={handleStartPause}
          >
            <Ionicons name={isRunning ? "pause" : "play"} size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.background }]}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="options" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Presets */}
        <View style={styles.presets}>
          {REST_PRESETS.slice(0, 4).map((preset) => (
            <TouchableOpacity
              key={preset.seconds}
              style={[
                styles.presetButton,
                { backgroundColor: colors.background },
                totalSeconds === preset.seconds && { backgroundColor: accentColor + "20", borderColor: accentColor },
              ]}
              onPress={() => handleSelectPreset(preset.seconds)}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: colors.textSecondary },
                  totalSeconds === preset.seconds && { color: accentColor, fontWeight: "700" },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Rest Time</Text>
            <View style={styles.presetGrid}>
              {REST_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.seconds}
                  style={[
                    styles.presetGridItem,
                    { backgroundColor: colors.background },
                    totalSeconds === preset.seconds && { backgroundColor: accentColor, borderColor: accentColor },
                  ]}
                  onPress={() => handleSelectPreset(preset.seconds)}
                >
                  <Text
                    style={[
                      styles.presetGridText,
                      { color: colors.text },
                      totalSeconds === preset.seconds && { color: "#FFFFFF", fontWeight: "700" },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.background }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
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
  timerIconContainer: {
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
    alignItems: "center",
    gap: spacing.sm,
  },
  minimizedTime: {
    ...typography.h3,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  miniButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
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
  timerDisplay: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  timerText: {
    fontSize: 64,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  mainButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  presets: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  presetText: {
    ...typography.caption,
    fontWeight: "600",
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
    maxWidth: 320,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  presetGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  presetGridItem: {
    width: 80,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  presetGridText: {
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
});
