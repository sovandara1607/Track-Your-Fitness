import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Platform, StyleSheet, View } from "react-native";

const TAB_COUNT = 4;
const TAB_ROUTES = ["index", "workouts", "progress", "profile"];

function getTabIndex(pathname: string): number {
  const route = pathname.replace("/(tabs)/", "").replace("/", "") || "index";
  const index = TAB_ROUTES.indexOf(route);
  return index >= 0 ? index : 0;
}

export default function TabLayout() {
  const { accentColor, colors, isDark } = useSettings();
  const pathname = usePathname();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [tabBarWidth, setTabBarWidth] = useState(0);

  const tabWidth = tabBarWidth / TAB_COUNT;
  const indicatorWidth = tabWidth - 12;
  const indicatorHeight = 52;

  useEffect(() => {
    if (tabBarWidth === 0) return;
    
    const tabIndex = getTabIndex(pathname);
    // Center the indicator on each tab
    const indicatorLeft = tabIndex * tabWidth + (tabWidth - indicatorWidth) / 2;
    
    Animated.spring(slideAnim, {
      toValue: indicatorLeft,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  }, [pathname, tabBarWidth]);

  const handleLayout = (event: LayoutChangeEvent) => {
    setTabBarWidth(event.nativeEvent.layout.width);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDark
              ? "rgba(30, 30, 35, 0.75)"
              : "rgba(255, 255, 255, 0.75)",
            borderColor: isDark
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.05)",
          },
        ],
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => (
          <View style={styles.blurContainer} onLayout={handleLayout}>
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
            {/* Liquid glass gradient overlay */}
            <View
              style={[
                styles.glassOverlay,
                {
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.03)"
                    : "rgba(255, 255, 255, 0.5)",
                },
              ]}
            />
            {/* Sliding glass indicator */}
            {tabBarWidth > 0 && (
              <Animated.View
                style={[
                  styles.slideIndicator,
                  {
                    width: indicatorWidth,
                    height: indicatorHeight,
                    backgroundColor: accentColor + "18",
                    borderColor: accentColor + "30",
                    transform: [{ translateX: slideAnim }],
                  },
                ]}
              >
                <BlurView
                  intensity={20}
                  tint={isDark ? "light" : "default"}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                />
              </Animated.View>
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: "Workouts",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "barbell" : "barbell-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "trending-up" : "trending-up-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 20,
    borderTopWidth: 0,
    borderWidth: 1,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 0,
    elevation: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    overflow: "hidden",
  },
  tabBarItem: {
    paddingTop: 4,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: "hidden",
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  slideIndicator: {
    position: "absolute",
    top: 6,
    left: 0,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});
