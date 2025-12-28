import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  
  workouts: defineTable({
    userId: v.string(),
    name: v.string(),
    date: v.number(),
    duration: v.number(),
    notes: v.optional(v.string()),
    completed: v.boolean(),
    favorite: v.optional(v.boolean()),
  }).index("by_user_id", ["userId"]),
  
  exercises: defineTable({
    userId: v.string(),
    workoutId: v.id("workouts"),
    name: v.string(),
    order: v.number(),
    sets: v.array(
      v.object({
        reps: v.number(),
        weight: v.number(),
        completed: v.boolean(),
      })
    ),
  })
    .index("by_user_id", ["userId"])
    .index("by_workout_id", ["workoutId"]),
  
  exerciseTemplates: defineTable({
    userId: v.string(),
    name: v.string(),
    category: v.string(),
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
