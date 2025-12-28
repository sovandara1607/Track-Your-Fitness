import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
   Alert,
   Linking,
   ScrollView,
   StyleSheet,
   Text,
   TouchableOpacity,
   View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AboutScreen() {
  const { colors, accentColor } = useSettings();
  const appVersion = "1.0.0";
  const buildNumber = "100";

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link");
    });
  };

  const handleRateApp = () => {
    Alert.alert(
      "Rate LIFT",
      "Would you like to rate LIFT on the App Store?",
      [
        { text: "Not Now", style: "cancel" },
        { text: "Rate Now", onPress: () => handleOpenLink("https://apps.apple.com") },
      ]
    );
  };

  const handleShareApp = () => {
    Alert.alert(
      "Share LIFT",
      "Share LIFT with your friends and workout buddies!",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About Us</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <View style={styles.appInfo}>
          <View style={[styles.logoContainer, { backgroundColor: accentColor + "20" }]}>
            <Ionicons name="fitness" size={48} color={accentColor} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>LIFT</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Build Your Strongest Self</Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>
            Version {appVersion} ({buildNumber})
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface }]} onPress={handleRateApp}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="star" size={24} color={staticColors.warning} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Rate LIFT</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.surface }]} onPress={handleShareApp}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="share-social" size={24} color={accentColor} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Share with Friends</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleOpenLink("https://liftapp.com/privacy")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-checkmark" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleOpenLink("https://liftapp.com/terms")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="document-text" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Terms of Service</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => handleOpenLink("https://liftapp.com/licenses")}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="code-slash" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Open Source Licenses</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Credits</Text>
          
          <View style={[styles.creditsCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.creditsTitle, { color: colors.text }]}>Development Team</Text>
            <Text style={[styles.creditsText, { color: colors.textSecondary }]}>
              LIFT is built with ❤️ by a passionate team of fitness enthusiasts and developers.
              Idea Lead by Year 3 Computer Scientist Students at PIU.
            </Text>
            
            <View style={[styles.techStack, { borderTopColor: colors.surfaceLight }]}>
              <Text style={[styles.techStackTitle, { color: colors.textMuted }]}>Built With</Text>
              <View style={styles.techBadges}>
                <View style={[styles.techBadge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.techBadgeText, { color: accentColor }]}>React Native</Text>
                </View>
                <View style={[styles.techBadge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.techBadgeText, { color: accentColor }]}>Expo</Text>
                </View>
                <View style={[styles.techBadge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.techBadgeText, { color: accentColor }]}>Convex</Text>
                </View>
                <View style={[styles.techBadge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.techBadgeText, { color: accentColor }]}>TypeScript</Text>
                </View>
                <View style={[styles.techBadge, { backgroundColor: accentColor + "20" }]}>
                  <Text style={[styles.techBadgeText, { color: accentColor }]}>Claude</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textMuted }]}>© 2025 LIFT. All rights reserved.</Text>
          <Text style={[styles.madeWith, { color: colors.textMuted }]}>Made with 💪 for fitness lovers</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.h3,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  appName: {
    ...typography.hero,
    letterSpacing: 6,
  },
  tagline: {
    ...typography.body,
    marginTop: spacing.xs,
  },
  version: {
    ...typography.caption,
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  menuItemText: {
    ...typography.body,
    fontWeight: "500",
  },
  creditsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  creditsTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  creditsText: {
    ...typography.body,
    lineHeight: 22,
  },
  techStack: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  techStackTitle: {
    ...typography.caption,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  techBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  techBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  techBadgeText: {
    ...typography.caption,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  copyright: {
    ...typography.caption,
  },
  madeWith: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
