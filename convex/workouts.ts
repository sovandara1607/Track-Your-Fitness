import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

export const list = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("workouts"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      date: v.number(),
      duration: v.number(),
      notes: v.optional(v.string()),
      completed: v.boolean(),
    })
  ),
  handler: async (ctx) => {
    // Demo mode: show all workouts (no user filtering)
    const workouts = await ctx.db
      .query("workouts")
      .order("desc")
      .collect();
    return workouts;
  },
});

export const getRecent = authQuery({
  args: { limit: v.number() },
  returns: v.array(
    v.object({
      _id: v.id("workouts"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      date: v.number(),
      duration: v.number(),
      notes: v.optional(v.string()),
      completed: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", "demo-user"))
      .order("desc")
      .take(args.limit);
    return workouts;
  },
});

export const getById = authQuery({
  args: { workoutId: v.id("workouts") },
  returns: v.union(
    v.object({
      _id: v.id("workouts"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      date: v.number(),
      duration: v.number(),
      notes: v.optional(v.string()),
      completed: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== "demo-user") {
      return null;
    }
    return workout;
  },
});

export const create = authMutation({
  args: {
    name: v.string(),
    date: v.number(),
    duration: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("workouts"),
  handler: async (ctx, args) => {
    const workoutId = await ctx.db.insert("workouts", {
      userId: "demo-user",
      name: args.name,
      date: args.date,
      duration: args.duration,
      notes: args.notes,
      completed: false,
    });
    return workoutId;
  },
});

export const update = authMutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.optional(v.string()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout) {
      throw new Error("Workout not found");
    }

    const updates: Partial<typeof workout> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.completed !== undefined) updates.completed = args.completed;

    await ctx.db.patch(args.workoutId, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { workoutId: v.id("workouts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== "demo-user") {
      throw new Error("Workout not found");
    }

    // Delete associated exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_workout_id", (q) => q.eq("workoutId", args.workoutId))
      .collect();

    for (const exercise of exercises) {
      await ctx.db.delete(exercise._id);
    }

    await ctx.db.delete(args.workoutId);
    return null;
  },
});

export const getStats = authQuery({
  args: {},
  returns: v.object({
    totalWorkouts: v.number(),
    totalMinutes: v.number(),
    thisWeekWorkouts: v.number(),
    currentStreak: v.number(),
  }),
  handler: async (ctx) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", "demo-user"))
      .collect();

    const completedWorkouts = workouts.filter((w) => w.completed);
    const totalMinutes = completedWorkouts.reduce((sum, w) => sum + w.duration, 0);

    // This week's workouts
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thisWeekWorkouts = completedWorkouts.filter((w) => w.date >= weekAgo).length;

    // Calculate streak
    let currentStreak = 0;
    const sortedWorkouts = completedWorkouts.sort((a, b) => b.date - a.date);
    
    if (sortedWorkouts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = today.getTime();
      
      for (const workout of sortedWorkouts) {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        
        if (workoutDate.getTime() === checkDate || workoutDate.getTime() === checkDate - 24 * 60 * 60 * 1000) {
          currentStreak++;
          checkDate = workoutDate.getTime() - 24 * 60 * 60 * 1000;
        } else if (workoutDate.getTime() < checkDate - 24 * 60 * 60 * 1000) {
          break;
        }
      }
    }

    return {
      totalWorkouts: completedWorkouts.length,
      totalMinutes,
      thisWeekWorkouts,
      currentStreak,
    };
  },
});

