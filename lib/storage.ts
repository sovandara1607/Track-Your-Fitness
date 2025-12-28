import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  NOTIFICATIONS: "@lift_notifications",
  THEME: "@lift_theme",
  PREFERENCES: "@lift_preferences",
} as const;

// Notification Settings
export type NotificationSettings = {
  workout_reminders: boolean;
  streak_alerts: boolean;
  achievements: boolean;
  weekly_summary: boolean;
  rest_day: boolean;
};

export const defaultNotificationSettings: NotificationSettings = {
  workout_reminders: true,
  streak_alerts: true,
  achievements: true,
  weekly_summary: false,
  rest_day: false,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return data ? JSON.parse(data) : defaultNotificationSettings;
  } catch {
    return defaultNotificationSettings;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save notification settings:", error);
  }
}

// Theme Settings
export type ThemeSettings = {
  theme: "light" | "dark" | "system";
  accentColor: string;
};

export const defaultThemeSettings: ThemeSettings = {
  theme: "dark",
  accentColor: "blue",
};

export async function getThemeSettings(): Promise<ThemeSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return data ? JSON.parse(data) : defaultThemeSettings;
  } catch {
    return defaultThemeSettings;
  }
}

export async function saveThemeSettings(settings: ThemeSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save theme settings:", error);
  }
}

// Preferences Settings
export type PreferencesSettings = {
  weightUnit: "kg" | "lbs";
  distanceUnit: "km" | "mi";
  showRestTimer: boolean;
  autoStartTimer: boolean;
  defaultRestTime: number;
  hapticFeedback: boolean;
  keepScreenOn: boolean;
};

export const defaultPreferencesSettings: PreferencesSettings = {
  weightUnit: "lbs",
  distanceUnit: "mi",
  showRestTimer: true,
  autoStartTimer: false,
  defaultRestTime: 90,
  hapticFeedback: true,
  keepScreenOn: true,
};

export async function getPreferencesSettings(): Promise<PreferencesSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? JSON.parse(data) : defaultPreferencesSettings;
  } catch {
    return defaultPreferencesSettings;
  }
}

export async function savePreferencesSettings(settings: PreferencesSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save preferences settings:", error);
  }
}

// Clear all settings (for sign out)
export async function clearAllSettings(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.NOTIFICATIONS,
      STORAGE_KEYS.THEME,
      STORAGE_KEYS.PREFERENCES,
    ]);
  } catch (error) {
    console.error("Failed to clear settings:", error);
  }
}
