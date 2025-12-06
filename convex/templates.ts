

import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

const templateValidator = v.object({
  _id: v.id("exerciseTemplates"),
  _creationTime: v.number(),
  userId: v.string(),
  name: v.string(),
  category: v.string(),
  defaultSets: v.number(),
  defaultReps: v.number(),
  defaultWeight: v.number(),
});

export const list = authQuery({
  args: {},
  returns: v.array(templateValidator),
  handler: async (ctx) => {
    const templates = await ctx.db
      .query("exerciseTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .collect();
    return templates;
  },
});

export const create = authMutation({
  args: {
    name: v.string(),
    category: v.string(),
    defaultSets: v.number(),
    defaultReps: v.number(),
    defaultWeight: v.number(),
  },
  returns: v.id("exerciseTemplates"),
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert("exerciseTemplates", {
      userId: ctx.user._id,
      name: args.name,
      category: args.category,
      defaultSets: args.defaultSets,
      defaultReps: args.defaultReps,
      defaultWeight: args.defaultWeight,
    });
    return templateId;
  },
});

export const seedDefaults = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("exerciseTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", ctx.user._id))
      .first();

    if (existing) return null;

    const defaults = [
      { name: "Bench Press", category: "chest", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      { name: "Incline Dumbbell Press", category: "chest", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      { name: "Deadlift", category: "back", defaultSets: 4, defaultReps: 6, defaultWeight: 225 },
      { name: "Pull-ups", category: "back", defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
      { name: "Barbell Row", category: "back", defaultSets: 4, defaultReps: 10, defaultWeight: 135 },
      { name: "Squat", category: "legs", defaultSets: 4, defaultReps: 8, defaultWeight: 185 },
      { name: "Leg Press", category: "legs", defaultSets: 3, defaultReps: 12, defaultWeight: 270 },
      { name: "Romanian Deadlift", category: "legs", defaultSets: 3, defaultReps: 10, defaultWeight: 135 },
      { name: "Overhead Press", category: "shoulders", defaultSets: 4, defaultReps: 10, defaultWeight: 95 },
      { name: "Lateral Raises", category: "shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 20 },
      { name: "Bicep Curls", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 30 },
      { name: "Tricep Pushdowns", category: "arms", defaultSets: 3, defaultReps: 12, defaultWeight: 50 },
      { name: "Plank", category: "core", defaultSets: 3, defaultReps: 60, defaultWeight: 0 },
      { name: "Running", category: "cardio", defaultSets: 1, defaultReps: 30, defaultWeight: 0 },
    ];

    for (const template of defaults) {
      await ctx.db.insert("exerciseTemplates", {
        userId: ctx.user._id,
        ...template,
      });
    }

    return null;
  },
});

