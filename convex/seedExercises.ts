import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createDefaultExercises = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const exercises = [
      // Chest
      { name: "Bench Press", category: "chest", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      { name: "Incline Bench Press", category: "chest", defaultSets: 3, defaultReps: 10, defaultWeight: 115 },
      { name: "Dumbbell Press", category: "chest", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      { name: "Push-ups", category: "chest", defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
      { name: "Chest Flys", category: "chest", defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
      
      // Back
      { name: "Deadlift", category: "back", defaultSets: 4, defaultReps: 6, defaultWeight: 225 },
      { name: "Pull-ups", category: "back", defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
      { name: "Barbell Row", category: "back", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      { name: "Lat Pulldown", category: "back", defaultSets: 3, defaultReps: 12, defaultWeight: 120 },
      { name: "Seated Cable Row", category: "back", defaultSets: 3, defaultReps: 12, defaultWeight: 100 },
      
      // Legs
      { name: "Squat", category: "legs", defaultSets: 4, defaultReps: 8, defaultWeight: 185 },
      { name: "Leg Press", category: "legs", defaultSets: 3, defaultReps: 12, defaultWeight: 270 },
      { name: "Romanian Deadlift", category: "legs", defaultSets: 3, defaultReps: 10, defaultWeight: 135 },
      { name: "Leg Curl", category: "legs", defaultSets: 3, defaultReps: 12, defaultWeight: 80 },
      { name: "Leg Extension", category: "legs", defaultSets: 3, defaultReps: 12, defaultWeight: 90 },
      { name: "Calf Raises", category: "legs", defaultSets: 3, defaultReps: 15, defaultWeight: 100 },
      
      // Shoulders
      { name: "Overhead Press", category: "shoulders", defaultSets: 4, defaultReps: 10, defaultWeight: 95 },
      { name: "Lateral Raises", category: "shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 20 },
      { name: "Front Raises", category: "shoulders", defaultSets: 3, defaultReps: 12, defaultWeight: 20 },
      { name: "Face Pulls", category: "shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 50 },
      { name: "Shrugs", category: "shoulders", defaultSets: 3, defaultReps: 12, defaultWeight: 80 },
      
      // Arms
      { name: "Bicep Curls", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
      { name: "Hammer Curls", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
      { name: "Tricep Pushdowns", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      { name: "Skull Crushers", category: "arms", defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
      { name: "Dips", category: "arms", defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
      
      // Core
      { name: "Plank", category: "core", defaultSets: 3, defaultReps: 60, defaultWeight: 0 },
      { name: "Russian Twists", category: "core", defaultSets: 3, defaultReps: 30, defaultWeight: 25 },
      { name: "Hanging Leg Raises", category: "core", defaultSets: 3, defaultReps: 12, defaultWeight: 0 },
      { name: "Ab Wheel", category: "core", defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
      
      // Cardio
      { name: "Running", category: "cardio", defaultSets: 1, defaultReps: 30, defaultWeight: 0 },
      { name: "Cycling", category: "cardio", defaultSets: 1, defaultReps: 30, defaultWeight: 0 },
      { name: "Rowing", category: "cardio", defaultSets: 1, defaultReps: 20, defaultWeight: 0 },
    ];

    const created = [];
    for (const exercise of exercises) {
      const id = await ctx.db.insert("exerciseTemplates", {
        userId: args.userId,
        ...exercise,
      });
      created.push(id);
    }

    return { count: created.length, message: `Created ${created.length} exercise templates` };
  },
});
