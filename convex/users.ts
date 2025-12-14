import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// User schema will be added to schema.ts
export const signUp = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User already exists");
    }

    // In production, hash the password!
    // For demo, we'll store it (don't do this in real apps)
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password, // Should be hashed!
      name: args.name,
      createdAt: Date.now(),
    });

    // Create default exercise templates for new user
    const defaultTemplates = [
      // Chest
      { name: "Bench Press", category: "chest", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      { name: "Incline Dumbbell Press", category: "chest", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      { name: "Push-ups", category: "chest", defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
      
      // Back
      { name: "Deadlift", category: "back", defaultSets: 4, defaultReps: 6, defaultWeight: 225 },
      { name: "Pull-ups", category: "back", defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
      { name: "Barbell Row", category: "back", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      
      // Legs
      { name: "Squat", category: "legs", defaultSets: 4, defaultReps: 8, defaultWeight: 185 },
      { name: "Leg Press", category: "legs", defaultSets: 3, defaultReps: 12, defaultWeight: 270 },
      { name: "Romanian Deadlift", category: "legs", defaultSets: 3, defaultReps: 10, defaultWeight: 135 },
      
      // Shoulders
      { name: "Overhead Press", category: "shoulders", defaultSets: 4, defaultReps: 10, defaultWeight: 95 },
      { name: "Lateral Raises", category: "shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 20 },
      
      // Arms
      { name: "Bicep Curls", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
      { name: "Tricep Pushdowns", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      
      // Core
      { name: "Plank", category: "core", defaultSets: 3, defaultReps: 60, defaultWeight: 0 },
      
      // Cardio
      { name: "Running", category: "cardio", defaultSets: 1, defaultReps: 30, defaultWeight: 0 },
    ];

    for (const template of defaultTemplates) {
      await ctx.db.insert("exerciseTemplates", {
        userId: userId.toString(),
        ...template,
      });
    }

    return { userId, email: args.email, name: args.name };
  },
});

export const signIn = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || user.password !== args.password) {
      throw new Error("Invalid credentials");
    }

    return { userId: user._id, email: user.email, name: user.name };
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    return { id: user._id, email: user.email, name: user.name };
  },
});
