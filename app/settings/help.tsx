import { AnimatedBackground } from "@/components/AnimatedBackground";
import { borderRadius, spacing, colors as staticColors, typography } from "@/constants/theme";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FAQ = {
  id: string;
  question: string;
  answer: string;
};

export default function HelpScreen() {
  const { colors, accentColor } = useSettings();
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqs: FAQ[] = [
    {
      id: "1",
      question: "How do I create a new workout?",
      answer: "Tap the '+' button on the Home or Workouts tab to create a new workout. You can add exercises from your template library or create custom ones.",
    },
    {
      id: "2",
      question: "How do I track my progress?",
      answer: "Visit the Progress tab to see your workout history, personal records, and statistics. You can view charts showing your improvement over time.",
    },
    {
      id: "3",
      question: "Can I create custom exercises?",
      answer: "Yes! When adding exercises to a workout, you can create new custom exercises by tapping 'Create New Exercise' and filling in the details.",
    },
    {
      id: "4",
      question: "How does the streak system work?",
      answer: "Your streak counts consecutive days with completed workouts. If you miss a day, your streak resets to zero. Rest days don't break your streak if configured in preferences.",
    },
    {
      id: "5",
      question: "How do I change weight units?",
      answer: "Go to Profile > Preferences and toggle between kg and lbs. Your existing data will be automatically converted.",
    },
    {
      id: "6",
      question: "Is my data backed up?",
      answer: "Yes, when you're signed in, your workout data is automatically synced to the cloud. You can access it from any device with your account.",
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:support@liftapp.com?subject=LIFT App Support");
  };

  const handleVisitWebsite = () => {
    Linking.openURL("https://liftapp.com");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AnimatedBackground />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Get Help</Text>
          
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]} onPress={handleContactSupport}>
            <View style={[styles.actionIcon, { backgroundColor: accentColor + "20" }]}>
              <Ionicons name="mail" size={24} color={accentColor} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Contact Support</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Send us an email and we'll get back to you
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]} onPress={handleVisitWebsite}>
            <View style={[styles.actionIcon, { backgroundColor: staticColors.success + "20" }]}>
              <Ionicons name="globe" size={24} color={staticColors.success} />
            </View>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Visit Website</Text>
              <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                Check out tutorials and guides
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          
          {faqs.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={[styles.faqItem, { backgroundColor: colors.surface }]}
              onPress={() => toggleFAQ(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                <Ionicons
                  name={expandedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textMuted}
                />
              </View>
              {expandedFAQ === faq.id && (
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Feedback</Text>
          
          <TouchableOpacity 
            style={[styles.feedbackCard, { backgroundColor: colors.surface }]}
            onPress={() => Linking.openURL("mailto:feedback@liftapp.com?subject=LIFT App Feedback")}
          >
            <Ionicons name="chatbubble-ellipses" size={32} color={accentColor} />
            <Text style={[styles.feedbackTitle, { color: colors.text }]}>Share Your Feedback</Text>
            <Text style={[styles.feedbackDescription, { color: colors.textSecondary }]}>
              We'd love to hear your thoughts on how we can improve LIFT
            </Text>
          </TouchableOpacity>
        </View>

        {/* Social */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Follow Us</Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-twitter" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-instagram" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-facebook" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.socialButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="logo-youtube" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    ...typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  actionDescription: {
    ...typography.caption,
  },
  faqItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    ...typography.body,
    fontWeight: "500",
    flex: 1,
    marginRight: spacing.sm,
  },
  faqAnswer: {
    ...typography.body,
    marginTop: spacing.md,
    lineHeight: 22,
  },
  feedbackCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  feedbackTitle: {
    ...typography.body,
    fontWeight: "600",
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  feedbackDescription: {
    ...typography.caption,
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
