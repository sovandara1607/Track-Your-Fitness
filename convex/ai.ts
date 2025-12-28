import { v } from "convex/values";
import { action } from "./_generated/server";

export const getAIRecoveryRecommendation = action({
  args: {
    workouts: v.array(
      v.object({
        name: v.string(),
        date: v.number(),
        duration: v.number(),
        completed: v.boolean(),
      })
    ),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    status: "rest" | "light" | "moderate" | "ready";
    title: string;
    message: string;
    tips: string[];
    insights: string;
    suggestedWorkout?: string;
  }> => {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback to rule-based if no API key
      return getFallbackRecommendation(args.workouts);
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    // Format workout history for AI
    const workoutSummary = args.workouts
      .filter((w) => w.completed)
      .map((w) => {
        const daysAgo = Math.floor((now - w.date) / oneDayMs);
        const intensity = w.duration < 20 ? "light" : w.duration < 40 ? "moderate" : w.duration < 60 ? "hard" : "intense";
        return `- ${w.name} (${w.duration} min, ${intensity}) - ${daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`}`;
      })
      .join("\n");

    const prompt = `You are a professional fitness coach and recovery specialist. Analyze the following workout history and provide personalized recovery recommendations.

WORKOUT HISTORY (Last 10 workouts):
${workoutSummary || "No recent workouts found."}

USER: ${args.userName || "Athlete"}
CURRENT DATE: ${new Date().toLocaleDateString()}

Based on exercise science principles, analyze:
1. Workout frequency and consistency
2. Intensity patterns
3. Recovery time between sessions
4. Potential overtraining signs

Respond with a JSON object (no markdown, just raw JSON):
{
  "status": "rest" | "light" | "moderate" | "ready",
  "title": "Short motivating title with emoji (max 30 chars)",
  "message": "2-3 sentence personalized recommendation explaining why",
  "tips": ["tip1", "tip2", "tip3"],
  "insights": "One sentence insight about their training pattern",
  "suggestedWorkout": "Optional: specific workout type if status is not 'rest'"
}

Status meanings:
- "rest": Complete rest day needed (high fatigue, overtraining risk)
- "light": Light activity only (walking, stretching, yoga)
- "moderate": Can workout but at reduced intensity
- "ready": Fully recovered, can do intense workout`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional fitness coach. Always respond with valid JSON only, no markdown formatting.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        console.error("OpenAI API error:", response.status);
        return getFallbackRecommendation(args.workouts);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        return getFallbackRecommendation(args.workouts);
      }

      // Parse JSON response (handle potential markdown wrapping)
      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "");
      }

      const parsed = JSON.parse(jsonStr);
      
      return {
        status: parsed.status || "ready",
        title: parsed.title || "Ready to Train! 💪",
        message: parsed.message || "You're doing great! Keep up the good work.",
        tips: parsed.tips || ["Stay hydrated", "Warm up properly", "Listen to your body"],
        insights: parsed.insights || "Your training is on track.",
        suggestedWorkout: parsed.suggestedWorkout,
      };
    } catch (error) {
      console.error("AI recommendation error:", error);
      return getFallbackRecommendation(args.workouts);
    }
  },
});

// Fallback rule-based recommendation
function getFallbackRecommendation(workouts: { name: string; date: number; duration: number; completed: boolean }[]): {
  status: "rest" | "light" | "moderate" | "ready";
  title: string;
  message: string;
  tips: string[];
  insights: string;
  suggestedWorkout?: string;
} {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Calculate fatigue score
  let fatigueScore = 0;
  const completedWorkouts = workouts.filter((w) => w.completed);
  
  completedWorkouts.forEach((workout) => {
    const daysAgo = (now - workout.date) / oneDayMs;
    const intensity = workout.duration < 20 ? 25 : workout.duration < 40 ? 50 : workout.duration < 60 ? 75 : 100;
    const decayFactor = Math.exp(-daysAgo / 2);
    fatigueScore += intensity * decayFactor;
  });
  fatigueScore = Math.min(fatigueScore, 100);

  // Count consecutive days
  const today = Math.floor(now / oneDayMs);
  const workoutDays = new Set(completedWorkouts.map((w) => Math.floor(w.date / oneDayMs)));
  let consecutiveDays = 0;
  let checkDay = today;
  while (workoutDays.has(checkDay)) {
    consecutiveDays++;
    checkDay--;
  }

  // Determine recommendation
  if (fatigueScore > 70 || consecutiveDays >= 3) {
    return {
      status: "rest",
      title: "Rest Day Recommended 😴",
      message: consecutiveDays >= 3 
        ? `You've trained ${consecutiveDays} days straight. Your muscles need time to repair and grow stronger.`
        : "Your body is showing signs of accumulated fatigue. Rest now to prevent overtraining.",
      tips: [
        "Focus on quality sleep (7-9 hours)",
        "Stay hydrated with water and electrolytes",
        "Light stretching or foam rolling is okay",
        "Eat protein-rich foods for recovery",
      ],
      insights: "Recovery is when your muscles actually grow stronger!",
    };
  }

  if (fatigueScore > 45 || consecutiveDays === 2) {
    return {
      status: "light",
      title: "Light Activity Day 🚶",
      message: "Your body is still recovering from recent training. A light session will promote blood flow without adding stress.",
      tips: [
        "20-30 minute walk or light jog",
        "Yoga or mobility work",
        "Swimming for active recovery",
        "Avoid heavy lifting today",
      ],
      insights: "Active recovery can speed up the healing process.",
      suggestedWorkout: "Yoga or stretching session",
    };
  }

  if (completedWorkouts.length > 0 && fatigueScore > 25) {
    const lastWorkout = completedWorkouts[0];
    const hoursSince = (now - lastWorkout.date) / (60 * 60 * 1000);
    
    if (hoursSince < 24) {
      return {
        status: "moderate",
        title: "Moderate Training OK 💪",
        message: "You're recovering well! Target different muscle groups than yesterday for optimal results.",
        tips: [
          "Work different muscle groups",
          "Keep intensity at 70-80%",
          "Extra focus on warm-up",
          "Monitor how you feel mid-workout",
        ],
        insights: "Training variety helps prevent overuse injuries.",
        suggestedWorkout: "Upper body if you did legs, or vice versa",
      };
    }
  }

  return {
    status: "ready",
    title: "Ready to Crush It! 🔥",
    message: completedWorkouts.length === 0 
      ? "No recent workouts detected. Today is a perfect day to start your fitness journey!"
      : "You're fully recovered and primed for an intense session. Make it count!",
    tips: [
      "Perfect day for heavy compound lifts",
      "Try high-intensity intervals",
      "Push your limits safely",
      "Fuel up with carbs pre-workout",
    ],
    insights: "Your body is ready to adapt and grow stronger!",
    suggestedWorkout: "Full body strength or HIIT session",
  };
}
