import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request permissions for push notifications
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log("Must use physical device for push notifications");
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!");
    return false;
  }

  // Required for Android
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF6B35",
    });
  }

  return true;
}

// Send a local notification for workout completion
export async function sendWorkoutCompletedNotification(workoutName: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Workout Complete! 💪",
      body: `Great job finishing "${workoutName}"! Keep up the amazing work!`,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Send immediately
  });
}

// Send a streak milestone notification
export async function sendStreakNotification(streakDays: number): Promise<void> {
  const milestones = [3, 7, 14, 30, 60, 90, 100, 365];
  
  if (milestones.includes(streakDays)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${streakDays} Day Streak! 🔥`,
        body: `You're on fire! You've worked out ${streakDays} days in a row!`,
        sound: true,
      },
      trigger: null,
    });
  }
}

// Send a weekly goal achieved notification
export async function sendWeeklyGoalNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Weekly Goal Achieved! 🎯",
      body: "You've hit your weekly workout goal! Amazing dedication!",
      sound: true,
    },
    trigger: null,
  });
}

// Schedule a workout reminder
export async function scheduleWorkoutReminder(hour: number = 18, minute: number = 0): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Time to Work Out! 🏋️",
      body: "Don't forget your workout today. Your future self will thank you!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  
  return identifier;
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get all scheduled notifications
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
