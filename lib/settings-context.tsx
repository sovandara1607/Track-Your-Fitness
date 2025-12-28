import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import {
   defaultNotificationSettings,
   defaultPreferencesSettings,
   defaultThemeSettings,
   getNotificationSettings,
   getPreferencesSettings,
   getThemeSettings,
   NotificationSettings,
   PreferencesSettings,
   saveNotificationSettings,
   savePreferencesSettings,
   saveThemeSettings,
   ThemeSettings,
} from "./storage";

// Accent color mapping
const accentColors: Record<string, string> = {
  blue: "#007AFF",
  green: "#34C759",
  purple: "#AF52DE",
  orange: "#FF9500",
  pink: "#FF2D55",
  teal: "#5AC8FA",
};

// Light theme colors
const lightColors = {
  background: "#F2F2F7",
  surface: "#FFFFFF",
  surfaceLight: "#E5E5EA",
  text: "#000000",
  textSecondary: "#3C3C43",
  textMuted: "#8E8E93",
  error: "#FF3B30",
  success: "#34C759",
};

// Dark theme colors
const darkColors = {
  background: "#0A0A0A",
  surface: "#1A1A1A",
  surfaceLight: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#8E8E93",
  textMuted: "#636366",
  error: "#FF3B30",
  success: "#34C759",
};

export type ThemeColors = typeof darkColors;

type SettingsContextType = {
  // Theme
  theme: ThemeSettings;
  updateTheme: (settings: Partial<ThemeSettings>) => Promise<void>;
  accentColor: string; // Computed accent color value
  colors: ThemeColors; // Dynamic colors based on theme mode
  isDark: boolean; // Whether currently in dark mode
  
  // Notifications
  notifications: NotificationSettings;
  updateNotifications: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Preferences
  preferences: PreferencesSettings;
  updatePreferences: (settings: Partial<PreferencesSettings>) => Promise<void>;
  
  // Loading state
  isLoading: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeSettings>(defaultThemeSettings);
  const [notifications, setNotifications] = useState<NotificationSettings>(defaultNotificationSettings);
  const [preferences, setPreferences] = useState<PreferencesSettings>(defaultPreferencesSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Computed accent color based on theme setting
  const accentColor = useMemo(() => {
    return accentColors[theme.accentColor] || accentColors.blue;
  }, [theme.accentColor]);

  // Determine if dark mode based on setting
  const isDark = useMemo(() => {
    if (theme.theme === "system") {
      return systemColorScheme === "dark";
    }
    return theme.theme === "dark";
  }, [theme.theme, systemColorScheme]);

  // Get dynamic colors based on theme
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    try {
      const [savedTheme, savedNotifications, savedPreferences] = await Promise.all([
        getThemeSettings(),
        getNotificationSettings(),
        getPreferencesSettings(),
      ]);
      setTheme(savedTheme);
      setNotifications(savedNotifications);
      setPreferences(savedPreferences);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (newSettings: Partial<ThemeSettings>) => {
    const updated = { ...theme, ...newSettings };
    setTheme(updated);
    await saveThemeSettings(updated);
  };

  const updateNotifications = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...notifications, ...newSettings };
    setNotifications(updated);
    await saveNotificationSettings(updated);
  };

  const updatePreferences = async (newSettings: Partial<PreferencesSettings>) => {
    const updated = { ...preferences, ...newSettings };
    setPreferences(updated);
    await savePreferencesSettings(updated);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        updateTheme,
        accentColor,
        colors,
        isDark,
        notifications,
        updateNotifications,
        preferences,
        updatePreferences,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
