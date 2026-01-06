import { AIChatbot } from "@/components/AIChatbot";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Button } from "@/components/Button";
import { HydrationTracker } from "@/components/HydrationTracker";
import { MusicPlayer } from "@/components/MusicPlayer";
import { RecoveryRecommendations } from "@/components/RecoveryRecommendations";
import { RestTimer } from "@/components/RestTimer";
import { borderRadius, getCategoryColor, spacing, colors as staticColors, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper to get time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

// Motivational quotes for pull-to-refresh
const MOTIVATIONAL_QUOTES = [
  { quote: "The only bad workout is the one that didn't happen.", author: "Sovandara Rith" },
  { quote: "Strength doesn't come from what you can do. It comes from overcoming the things you once thought you couldn't.", author: "Rikki Rogers" },
  { quote: "The pain you feel today will be the strength you feel tomorrow.", author: "Arnold Schwarzenegger" },
  { quote: "Your body can stand almost anything. It's your mind that you have to convince.", author: "Sovandara Rith" },
  { quote: "Success isn't always about greatness. It's about consistency.", author: "Dwayne Johnson" },
  { quote: "The difference between try and triumph is a little 'umph'.", author: "Marvin Phillips" },
  { quote: "Push yourself because no one else is going to do it for you.", author: "Sovandara Rith" },
  { quote: "Fitness is not about being better than someone else. It's about being better than you used to be.", author: "Khloe Kardashian" },
  { quote: "The only way to define your limits is by going beyond them.", author: "Arthur Clarke" },
  { quote: "Don't wish for a good body, work for it.", author: "Sovandara Rith" },
];

// Days of the week
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKLY_GOAL = 8; // Default weekly goal

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accentColor, colors } = useSettings();
  
  // State for pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );
  const [showQuote, setShowQuote] = useState(false);
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  
  // State for long press popup
  const [selectedWorkout, setSelectedWorkout] = useState<{
    id: Id<"workouts">;
    name: string;
    completed: boolean;
  } | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  
  // State for celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  
  // Rain effect - more particles falling from top
  const rainAnims = useRef(
    Array.from({ length: 30 }, () => ({
      translateY: new Animated.Value(-100),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
    }))
  ).current;

  const recentWorkouts = useQuery(
    api.workouts.getRecent,
    user ? { userId: user.id, limit: 3 } : "skip",
  );
  const recoveryWorkouts = useQuery(
    api.workouts.getRecent,
    user ? { userId: user.id, limit: 10 } : "skip",
  );
  const stats = useQuery(
    api.workouts.getStats,
    user ? { userId: user.id } : "skip",
  );
  const profile = useQuery(
    api.profile.getProfile,
    user ? { userId: user.id as Id<"users"> } : "skip",
  );
  const weeklyProgress = useQuery(
    api.workouts.getWeeklyProgress,
    user ? { userId: user.id, weeklyGoal: WEEKLY_GOAL } : "skip",
  );
  const suggestions = useQuery(
    api.workouts.getWorkoutSuggestions,
    user ? { userId: user.id } : "skip",
  );
  const deleteWorkout = useMutation(api.workouts.remove);
  const updateWorkout = useMutation(api.workouts.update);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Pick a new random quote
    setCurrentQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    setShowQuote(true);
    
    // Animate quote in
    Animated.timing(quoteOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Data will auto-refresh with Convex, just wait a bit for UX
    setTimeout(() => {
      setRefreshing(false);
      // Fade out quote after a delay
      setTimeout(() => {
        Animated.timing(quoteOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => setShowQuote(false));
      }, 3000);
    }, 1000);
  }, [quoteOpacity]);

  // Check if weekly goal is completed and show celebration
  useEffect(() => {
    if (
      weeklyProgress?.percentComplete === 100 &&
      !hasShownCelebration &&
      !showCelebration
    ) {
      // Trigger celebration
      setShowCelebration(true);
      setHasShownCelebration(true);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Animate the celebration modal
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate rain effect - particles falling from top
      rainAnims.forEach((anim, index) => {
        const delay = (index % 10) * 100 + Math.random() * 200;
        const duration = 2000 + Math.random() * 1500;
        const startX = Math.random() * 400 - 200; // Random horizontal position
        
        anim.translateX.setValue(startX);
        anim.translateY.setValue(-100);
        anim.opacity.setValue(1);
        anim.scale.setValue(0.5 + Math.random() * 0.5);
        
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: 900,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateX, {
              toValue: startX + (Math.random() * 100 - 50), // Slight drift
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: Math.random() * 6 - 3,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(duration * 0.7),
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start();
      });
    }
  }, [weeklyProgress?.percentComplete, hasShownCelebration, showCelebration, celebrationScale, celebrationOpacity, rainAnims]);

  const closeCelebration = () => {
    Animated.parallel([
      Animated.timing(celebrationScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(celebrationOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowCelebration(false);
      // Reset rain for next time
      rainAnims.forEach((anim) => {
        anim.translateX.setValue(0);
        anim.translateY.setValue(-100);
        anim.rotate.setValue(0);
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
      });
      celebrationScale.setValue(0);
    });
  };

  // Get personalized greeting
  const greeting = useMemo(() => getGreeting(), []);
  const displayName = profile?.displayName || profile?.name || user?.name;
  const firstName = displayName?.split(" ")[0] || "there";

  const handleLongPress = (workout: { _id: Id<"workouts">; name: string; completed: boolean }) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedWorkout({ id: workout._id, name: workout.name, completed: workout.completed });
    setPopupVisible(true);
  };

  const handleViewWorkout = () => {
    if (selectedWorkout) {
      setPopupVisible(false);
      router.push({
        pathname: "/workout/[id]",
        params: { id: selectedWorkout.id },
      });
    }
  };

  const handleToggleComplete = async () => {
    if (selectedWorkout && user) {
      await updateWorkout({
        userId: user.id,
        workoutId: selectedWorkout.id,
        completed: !selectedWorkout.completed,
      });
      setPopupVisible(false);
    }
  };

  const handleDeleteWorkout = () => {
    if (!selectedWorkout || !user) return;
    
    Alert.alert(
      "Delete Workout",
      `Are you sure you want to delete "${selectedWorkout.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteWorkout({ userId: user.id, workoutId: selectedWorkout.id });
            setPopupVisible(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
            colors={[accentColor]}
          />
        }
      >
        {/* Motivational Quote Banner */}
        {showQuote && (
          <Animated.View style={[styles.quoteBanner, { backgroundColor: accentColor + "15", opacity: quoteOpacity }]}>
            <Ionicons name="sparkles" size={20} color={accentColor} />
            <View style={styles.quoteContent}>
              <Text style={[styles.quoteText, { color: colors.text }]}>"{currentQuote.quote}"</Text>
              <Text style={[styles.quoteAuthor, { color: colors.textSecondary }]}>— {currentQuote.author}</Text>
            </View>
          </Animated.View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.headerAvatar, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            {profile?.profileImageUrl ? (
              <Image
                source={{ uri: profile.profileImageUrl }}
                style={styles.headerAvatarImage}
              />
            ) : (
              <Ionicons name="person" size={28} color={accentColor} />
            )}
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.text }]}>
              {greeting}, {firstName} 👋
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ready to crush your workout?
            </Text>
          </View>
        </View>

        {/* Weekly Goal Tracker */}
        <View style={[styles.weeklyCard, { backgroundColor: colors.surface }]}>
          <View style={styles.weeklyHeader}>
            <View>
              <Text style={[styles.weeklyTitle, { color: colors.text }]}>Weekly Goal</Text>
              <Text style={[styles.weeklySubtitle, { color: colors.textSecondary }]}>
                {weeklyProgress?.completedThisWeek ?? 0} of {WEEKLY_GOAL} workouts
              </Text>
            </View>
            <View style={[styles.weeklyBadge, { backgroundColor: accentColor + "20" }]}>
              <Text style={[styles.weeklyBadgeText, { color: accentColor }]}>
                {weeklyProgress?.percentComplete ?? 0}%
              </Text>
            </View>
          </View>
          
          {/* Progress Bar */}
          <View style={[styles.weeklyProgressBar, { backgroundColor: colors.background }]}>
            <View 
              style={[
                styles.weeklyProgressFill, 
                { width: `${weeklyProgress?.percentComplete ?? 0}%`, backgroundColor: accentColor }
              ]} 
            />
          </View>

          {/* Days of the week */}
          <View style={styles.weekDays}>
            {DAYS.map((day, index) => {
              const isActive = weeklyProgress?.daysWithWorkouts?.includes(index);
              const isToday = new Date().getDay() === index;
              return (
                <View 
                  key={index} 
                  style={[
                    styles.dayCircle,
                    { backgroundColor: isActive ? accentColor : colors.background },
                    isToday && !isActive && { borderColor: accentColor, borderWidth: 2 }
                  ]}
                >
                  <Text 
                    style={[
                      styles.dayText, 
                      { color: isActive ? "#FFFFFF" : isToday ? accentColor : colors.textMuted }
                    ]}
                  >
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Workout Suggestions */}
        {suggestions && suggestions.length > 0 && suggestions[0].daysSinceLastWorkout >= 3 && (
          <View style={styles.suggestionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Suggestions</Text>
            {suggestions
              .filter((s) => s.daysSinceLastWorkout >= 3)
              .slice(0, 2)
              .map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionCard, { backgroundColor: colors.surface }]}
                  onPress={() => router.push("/new-workout")}
                  activeOpacity={0.7}
                >
                  <View 
                    style={[
                      styles.suggestionDot, 
                      { backgroundColor: getCategoryColor(suggestion.category) }
                    ]} 
                  />
                  <View style={styles.suggestionContent}>
                    <Text style={[styles.suggestionCategory, { color: colors.text }]}>
                      {suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
                    </Text>
                    <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                      {suggestion.suggestion}
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={accentColor} />
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="barbell" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalWorkouts ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Workouts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="time" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.totalMinutes ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Minutes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="flame" size={24} color={accentColor} />
            <Text style={[styles.statValue, { color: colors.text }]}>{stats?.currentStreak ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </View>
        </View>

        {/* Recovery Recommendations */}
        <View style={styles.section}>
          <RecoveryRecommendations 
            recentWorkouts={recoveryWorkouts?.map(w => ({
              date: w.date,
              duration: w.duration,
              completed: w.completed,
              name: w.name,
            })) ?? []}
          />
        </View>

        {/* Smart Tools Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: spacing.md }]}>Smart Tools</Text>
          <RestTimer />
          <View style={{ height: spacing.md }} />
          <HydrationTracker />
          <View style={{ height: spacing.md }} />
          <MusicPlayer />
        </View>

        {/* Quick Action */}
        <View style={styles.section}>
          <Button
            title="Start New Workout"
            onPress={() => router.push("/new-workout")}
            style={styles.primaryButton}
          />
        </View>

        {/* Recent Workouts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Workouts</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/workouts")}>
              <Text style={[styles.seeAll, { color: accentColor }]}>See All</Text>
            </TouchableOpacity>
          </View>

          {!recentWorkouts ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Loading...</Text>
            </View>
          ) : recentWorkouts.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Ionicons
                name="barbell-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No workouts yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                Start your first workout to see it here
              </Text>
            </View>
          ) : (
            recentWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout._id}
                style={[styles.workoutCard, { backgroundColor: colors.surface }]}
                onPress={() =>
                  router.push({
                    pathname: "/workout/[id]",
                    params: { id: workout._id },
                  })
                }
                onLongPress={() => handleLongPress(workout)}
                delayLongPress={400}
                activeOpacity={0.7}
              >
                <View style={styles.workoutCardContent}>
                  <View style={styles.workoutCardHeader}>
                    <Text style={[styles.workoutName, { color: colors.text }]}>{workout.name}</Text>
                    {workout.completed && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={staticColors.success}
                      />
                    )}
                  </View>
                  <Text style={[styles.workoutDate, { color: colors.textSecondary }]}>
                    {new Date(workout.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.workoutDuration, { color: colors.textMuted }]}>
                    {workout.duration} minutes
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Long Press Popup Modal */}
      <Modal
        visible={popupVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <TouchableOpacity
          style={styles.popupOverlay}
          activeOpacity={1}
          onPress={() => setPopupVisible(false)}
        >
          <View style={[styles.popupContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.popupTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedWorkout?.name}
            </Text>
            
            <TouchableOpacity
              style={[styles.popupOption, { borderBottomColor: colors.background }]}
              onPress={handleViewWorkout}
            >
              <Ionicons name="eye-outline" size={22} color={accentColor} />
              <Text style={[styles.popupOptionText, { color: colors.text }]}>View Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.popupOption, { borderBottomColor: colors.background }]}
              onPress={handleToggleComplete}
            >
              <Ionicons 
                name={selectedWorkout?.completed ? "close-circle-outline" : "checkmark-circle-outline"} 
                size={22} 
                color={selectedWorkout?.completed ? staticColors.warning : staticColors.success} 
              />
              <Text style={[styles.popupOptionText, { color: colors.text }]}>
                {selectedWorkout?.completed ? "Mark as Incomplete" : "Mark as Complete"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupOption}
              onPress={handleDeleteWorkout}
            >
              <Ionicons name="trash-outline" size={22} color={staticColors.error} />
              <Text style={[styles.popupOptionText, { color: staticColors.error }]}>Delete Workout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.popupCancel, { backgroundColor: colors.background }]}
              onPress={() => setPopupVisible(false)}
            >
              <Text style={[styles.popupCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="none"
        onRequestClose={closeCelebration}
      >
        <TouchableOpacity
          style={styles.celebrationOverlay}
          activeOpacity={1}
          onPress={closeCelebration}
        >
          {/* Rain effect - emojis and shapes falling from top */}
          {rainAnims.map((anim, index) => {
            const emojis = ["🎉", "⭐", "🏆", "💪", "🔥", "✨", "🎊", "💥", "🌟", "👏"];
            const emoji = emojis[index % emojis.length];
            
            return (
              <Animated.Text
                key={index}
                style={[
                  styles.rainDrop,
                  {
                    opacity: anim.opacity,
                    transform: [
                      { translateX: anim.translateX },
                      { translateY: anim.translateY },
                      { scale: anim.scale },
                      { rotate: anim.rotate.interpolate({
                        inputRange: [-3, 3],
                        outputRange: ["-180deg", "180deg"],
                      })},
                    ],
                  },
                ]}
              >
                {emoji}
              </Animated.Text>
            );
          })}
          
          {/* Celebration Content */}
          <Animated.View 
            style={[
              styles.celebrationContent, 
              { 
                backgroundColor: colors.surface,
                opacity: celebrationOpacity,
                transform: [{ scale: celebrationScale }],
              }
            ]}
          >
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={[styles.celebrationTitle, { color: colors.text }]}>
              Goal Crushed!
            </Text>
            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
              You completed {WEEKLY_GOAL} workouts this week!
            </Text>
            <Text style={styles.celebrationStars}>⭐️ 🏆 ⭐️</Text>
            <TouchableOpacity
              style={[styles.celebrationButton, { backgroundColor: accentColor }]}
              onPress={closeCelebration}
            >
              <Text style={styles.celebrationButtonText}>Keep Going!</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* AI Chatbot */}
      <AIChatbot />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  quoteBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  quoteContent: {
    flex: 1,
  },
  quoteText: {
    ...typography.body,
    fontStyle: "italic",
    lineHeight: 22,
  },
  quoteAuthor: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingVertical: spacing.sm,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  greeting: {
    ...typography.h2,
    marginBottom: spacing.xs,
    lineHeight: 32,
  },
  subtitle: {
    ...typography.body,
    lineHeight: 22,
  },
  // Weekly Goal Card
  weeklyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  weeklyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  weeklyTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  weeklySubtitle: {
    ...typography.caption,
  },
  weeklyBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  weeklyBadgeText: {
    ...typography.body,
    fontWeight: "700",
  },
  weeklyProgressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  weeklyProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    ...typography.caption,
    fontWeight: "600",
  },
  // Suggestions Section
  suggestionsSection: {
    marginBottom: spacing.xl,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  suggestionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.md,
  },
  suggestionContent: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  suggestionCategory: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  suggestionText: {
    ...typography.caption,
    marginTop: spacing.sm,
    paddingRight: spacing.sm,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginHorizontal: spacing.xs,
    minHeight: 100,
  },
  statValue: {
    ...typography.h2,
    textAlign: "center",
  },
  statLabel: {
    ...typography.caption,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xl,
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
  seeAll: {
    ...typography.body,
    fontWeight: "600",
  },
  primaryButton: {
    marginBottom: spacing.md,
  },
  workoutCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  workoutCardContent: {
    flex: 1,
  },
  workoutCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  workoutName: {
    ...typography.h3,
  },
  workoutDate: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  workoutDuration: {
    ...typography.caption,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  // Popup Modal Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  popupContent: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  popupTitle: {
    ...typography.h3,
    textAlign: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  popupOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  popupOptionText: {
    ...typography.body,
    fontWeight: "500",
  },
  popupCancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  popupCancelText: {
    ...typography.body,
    fontWeight: "600",
  },
  // Celebration Modal Styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  rainDrop: {
    position: "absolute",
    top: 0,
    left: "50%",
    fontSize: 28,
  },
  celebrationContent: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginHorizontal: spacing.lg,
    maxWidth: 320,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  celebrationTitle: {
    ...typography.h1,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  celebrationSubtitle: {
    ...typography.body,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  celebrationStars: {
    fontSize: 32,
    marginBottom: spacing.lg,
  },
  celebrationButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.md,
  },
  celebrationButtonText: {
    ...typography.body,
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
