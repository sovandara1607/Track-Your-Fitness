import { borderRadius, spacing, typography } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { useSettings } from "@/lib/settings-context";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
   ActivityIndicator,
   Animated,
   Dimensions,
   FlatList,
   Keyboard,
   KeyboardAvoidingView,
   Modal,
   Platform,
   StyleSheet,
   Text,
   TextInput,
   TouchableOpacity,
   TouchableWithoutFeedback,
   View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const QUICK_QUESTIONS = [
  "How do I create a workout?",
  "What are Smart Tools?",
  "How does recovery tracking work?",
  "How do I track my progress?",
];

export function AIChatbot() {
  const { colors, accentColor } = useSettings();
  const chatWithBot = useAction(api.chatbot.chatWithBot);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hey there! 👋 I'm FitBot, your fitness assistant!\n\nAsk me anything about the app - workouts, progress tracking, smart tools, or any features you'd like to explore!",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fabScale = useRef(new Animated.Value(1)).current;
  const flatListRef = useRef<FlatList>(null);

  const openChat = useCallback(() => {
    setIsOpen(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeChat = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsOpen(false));
  }, [slideAnim]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setIsLoading(true);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        // Get conversation history (last 10 messages for context)
        const history = messages.slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const result = await chatWithBot({
          message: text.trim(),
          conversationHistory: history,
        });

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: result.response,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Scroll to bottom after response
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I couldn't process that. Please try again! 🔄",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, chatWithBot]
  );

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
          {
            backgroundColor: isUser ? accentColor : colors.surface,
          },
        ]}
      >
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: accentColor + "20" }]}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <Text
            style={[
              styles.messageText,
              { color: isUser ? "#FFFFFF" : colors.text },
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  // FAB pulse animation
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fabScale]);

  return (
    <>
      {/* Floating Action Button */}
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: accentColor,
            transform: [{ scale: fabScale }],
            shadowColor: accentColor,
          },
        ]}
      >
        <TouchableOpacity onPress={openChat} style={styles.fabTouchable}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeChat}>
        <TouchableWithoutFeedback onPress={closeChat}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.chatContainer,
            {
              backgroundColor: colors.background,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.chatHeader, { backgroundColor: colors.surface }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerAvatar, { backgroundColor: accentColor + "20" }]}>
                <Text style={styles.headerAvatarText}>🤖</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>FitBot</Text>
                <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                  Your fitness assistant
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeChat} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={styles.chatContent}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={100}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={
                isLoading ? (
                  <View style={[styles.loadingBubble, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="small" color={accentColor} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                      FitBot is thinking...
                    </Text>
                  </View>
                ) : null
              }
            />

            {/* Quick Questions */}
            {messages.length <= 2 && (
              <View style={styles.quickQuestionsContainer}>
                <Text style={[styles.quickQuestionsTitle, { color: colors.textSecondary }]}>
                  Quick questions:
                </Text>
                <View style={styles.quickQuestions}>
                  {QUICK_QUESTIONS.map((q, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.quickQuestion, { backgroundColor: colors.surface }]}
                      onPress={() => handleQuickQuestion(q)}
                    >
                      <Text style={[styles.quickQuestionText, { color: colors.text }]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Input */}
            <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                placeholder="Ask me anything..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => sendMessage(inputText)}
                returnKeyType="send"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim() ? accentColor : colors.background,
                  },
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() ? "#FFFFFF" : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  fabTouchable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  chatContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    fontSize: 24,
  },
  headerTitle: {
    ...typography.h3,
  },
  headerSubtitle: {
    ...typography.caption,
  },
  closeButton: {
    padding: spacing.sm,
  },
  chatContent: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageBubble: {
    flexDirection: "row",
    marginBottom: spacing.md,
    maxWidth: "85%",
  },
  userBubble: {
    alignSelf: "flex-end",
    borderRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.sm,
  },
  botBubble: {
    alignSelf: "flex-start",
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.sm,
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  botAvatarText: {
    fontSize: 16,
  },
  messageContent: {
    flex: 1,
    padding: spacing.md,
  },
  messageText: {
    ...typography.body,
    lineHeight: 22,
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
  },
  quickQuestionsContainer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  quickQuestionsTitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  quickQuestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickQuestion: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  quickQuestionText: {
    ...typography.caption,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
