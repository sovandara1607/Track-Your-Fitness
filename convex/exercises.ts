import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

const setValidator = v.object({
  reps: v.number(),
  weight: v.number(),
  completed: v.boolean(),
});

const exerciseValidator = v.object({
  _id: v.id("exercises"),
  _creationTime: v.number(),
  workoutId: v.id("workouts"),
  userId: v.string(),
  name: v.string(),
  sets: v.array(setValidator),
  order: v.number(),
});

export const listByWorkout = authQuery({
  args: { userId: v.string(), workoutId: v.id("workouts") },
  returns: v.array(exerciseValidator),
  handler: async (ctx, args) => {
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_workout_id", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    return exercises
      .filter((e) => e.userId === args.userId)
      .sort((a, b) => a.order - b.order);
  },
});

export const create = authMutation({
  args: {
    userId: v.string(),
    workoutId: v.id("workouts"),
    name: v.string(),
    sets: v.array(setValidator),
    order: v.number(),
  },
  returns: v.id("exercises"),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== args.userId) {
      throw new Error("Workout not found");
    }

    const exerciseId = await ctx.db.insert("exercises", {
      workoutId: args.workoutId,
      userId: args.userId,
      name: args.name,
      sets: args.sets,
      order: args.order,
    });

    // Check for personal record
    const maxWeight = Math.max(...args.sets.map((s) => s.weight));
    const maxReps = Math.max(...args.sets.map((s) => s.reps));

    const existingPR = await ctx.db
      .query("personalRecords")
      .withIndex("by_user_id_and_exercise", (q) =>
        q.eq("userId", args.userId).eq("exerciseName", args.name)
      )
      .first();

    if (!existingPR) {
      await ctx.db.insert("personalRecords", {
        userId: args.userId,
        exerciseName: args.name,
        maxWeight,
        maxReps,
        date: Date.now(),
      });
    } else if (maxWeight > existingPR.maxWeight || maxReps > existingPR.maxReps) {
      await ctx.db.patch(existingPR._id, {
        maxWeight: Math.max(maxWeight, existingPR.maxWeight),
        maxReps: Math.max(maxReps, existingPR.maxReps),
        date: Date.now(),
      });
    }

    return exerciseId;
  },
});

export const update = authMutation({
  args: {
    userId: v.string(),
    exerciseId: v.id("exercises"),
    name: v.optional(v.string()),
    sets: v.optional(v.array(setValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise || exercise.userId !== args.userId) {
      throw new Error("Exercise not found");
    }

    const updates: Partial<typeof exercise> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.sets !== undefined) updates.sets = args.sets;

    await ctx.db.patch(args.exerciseId, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { userId: v.string(), exerciseId: v.id("exercises") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise || exercise.userId !== args.userId) {
      throw new Error("Exercise not found");
    }

    await ctx.db.delete(args.exerciseId);
    return null;
  },
});

export const getPersonalRecords = authQuery({
  args: { userId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("personalRecords"),
      _creationTime: v.number(),
      userId: v.string(),
      exerciseName: v.string(),
      maxWeight: v.number(),
      maxReps: v.number(),
      date: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("personalRecords")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();
    return records;
  },
});

