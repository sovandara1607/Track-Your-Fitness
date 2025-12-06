

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workouts: defineTable({
    userId: v.string(),
    name: v.string(),
    date: v.number(),
    duration: v.number(), // in minutes
    notes: v.optional(v.string()),
    completed: v.boolean(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_date", ["userId", "date"]),

  exercises: defineTable({
    workoutId: v.id("workouts"),
    userId: v.string(),
    name: v.string(),
    sets: v.array(
      v.object({
        reps: v.number(),
        weight: v.number(),
        completed: v.boolean(),
      })
    ),
    order: v.number(),
  })
    .index("by_workout_id", ["workoutId"])
    .index("by_user_id", ["userId"]),

  exerciseTemplates: defineTable({
    userId: v.string(),
    name: v.string(),
    category: v.string(), // "chest", "back", "legs", "shoulders", "arms", "core", "cardio"
    defaultSets: v.number(),
    defaultReps: v.number(),
    defaultWeight: v.number(),
  }).index("by_user_id", ["userId"]),

  personalRecords: defineTable({
    userId: v.string(),
    exerciseName: v.string(),
    maxWeight: v.number(),
    maxReps: v.number(),
    date: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_exercise", ["userId", "exerciseName"]),
});

