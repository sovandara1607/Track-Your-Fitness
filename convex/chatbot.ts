import { v } from "convex/values";
import { action } from "./_generated/server";

// App features context for the AI
const APP_CONTEXT = `
You are FitBot, a helpful AI assistant for the "Track Your Fitness" mobile app. You help users understand and use the app's features.

## APP FEATURES:

### 1. WORKOUTS
- Create custom workouts with exercises
- Track sets, reps, and weights
- Mark workouts as completed
- Favorite workouts for quick access
- Swipe left to favorite, swipe right to delete
- View workout history organized by month
- Long press on workouts for quick actions

### 2. EXERCISES
- Add multiple exercises to each workout
- Track sets with reps and weight
- Mark individual sets as completed
- Exercise templates by category (Chest, Back, Legs, Shoulders, Arms, Core, Cardio)
- Personal records are automatically tracked

### 3. PROGRESS TRACKING
- View total workouts completed
- Track total minutes exercised
- Current workout streak (consecutive days)
- Weekly progress with goal tracking (default: 4 workouts/week)
- Visual progress charts and statistics
- Personal records for each exercise

### 4. SMART TOOLS (on Home Screen)
- **Rest Timer**: Customizable rest periods (30s, 60s, 90s, 120s), plays sound when complete
- **Hydration Tracker**: Track daily water intake (8 glasses goal), celebration animation when goal reached, manual reset button
- **Music Player**: Quick access to workout playlists (Khmer/Sigma themed)

### 5. AI RECOVERY RECOMMENDATIONS
- Analyzes your workout history using AI
- Provides personalized rest day suggestions
- Four status levels: Ready, Moderate, Light, Rest
- Shows fatigue meter and action tips
- Powered by OpenAI for smart insights

### 6. PROFILE
- View your stats and achievements
- Personal records display
- Account settings access

### 7. SETTINGS
- **Theme**: Light/Dark mode, accent color customization
- **Notifications**: Workout reminders, achievement alerts
- **Preferences**: Weekly goal, measurement units
- **Help**: FAQs and support
- **About**: App version and info

### 8. UI FEATURES
- Animated background with floating particles
- Pull-to-refresh with motivational quotes
- Liquid glass-style tab bar
- Haptic feedback on interactions
- Celebration animations for achievements

## HOW TO USE:
- Home screen shows daily overview and quick actions
- Tap + button to create new workout
- Use bottom tabs to navigate: Home, Progress, Workouts, Profile
- Access settings from Profile screen
- Long press items for additional options

Be friendly, helpful, and concise. If asked about features not in the app, suggest it as a great idea for future updates!
`;

export const chatWithBot = action({
  args: {
    message: v.string(),
    conversationHistory: v.optional(
      v.array(
        v.object({
          role: v.union(v.literal("user"), v.literal("assistant")),
          content: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<{ response: string; error?: string }> => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        response:
          "I'm FitBot! 🤖 I can help you with the app, but I'm currently in offline mode. Here are some tips:\n\n• Tap the + button to create workouts\n• Use Smart Tools for timers and hydration\n• Check Progress tab for your stats\n• Swipe on workouts to favorite/delete",
        error: "API key not configured",
      };
    }

    const messages = [
      {
        role: "system" as const,
        content: APP_CONTEXT,
      },
      ...(args.conversationHistory || []).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: args.message,
      },
    ];

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", response.status);
        return {
          response:
            "Sorry, I'm having trouble connecting right now. Try asking me again in a moment! 🔄",
          error: `API error: ${response.status}`,
        };
      }

      const data = await response.json();
      const botResponse = data.choices?.[0]?.message?.content;

      if (!botResponse) {
        return {
          response: "I didn't quite catch that. Could you rephrase your question? 🤔",
          error: "Empty response",
        };
      }

      return { response: botResponse };
    } catch (error) {
      console.error("Chat error:", error);
      return {
        response:
          "Oops! Something went wrong. Let me try again - what would you like to know about the app? 💪",
        error: String(error),
      };
    }
  },
});
