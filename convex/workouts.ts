import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";

export const list = authQuery({
  args: { userId: v.string() },
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
      favorite: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return workouts;
  },
});

export const getRecent = authQuery({
  args: { userId: v.string(), limit: v.number() },
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
      favorite: v.optional(v.boolean()),
    })
  ),
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit);
    return workouts;
  },
});

export const getById = authQuery({
  args: { userId: v.string(), workoutId: v.id("workouts") },
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
      favorite: v.optional(v.boolean()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== args.userId) {
      return null;
    }
    return workout;
  },
});

export const create = authMutation({
  args: {
    userId: v.string(),
    name: v.string(),
    date: v.number(),
    duration: v.number(),
    notes: v.optional(v.string()),
  },
  returns: v.id("workouts"),
  handler: async (ctx, args) => {
    const workoutId = await ctx.db.insert("workouts", {
      userId: args.userId,
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
    userId: v.string(),
    workoutId: v.id("workouts"),
    name: v.optional(v.string()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    favorite: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== args.userId) {
      throw new Error("Workout not found");
    }

    const updates: Partial<typeof workout> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.completed !== undefined) updates.completed = args.completed;
    if (args.favorite !== undefined) updates.favorite = args.favorite;

    await ctx.db.patch(args.workoutId, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { userId: v.string(), workoutId: v.id("workouts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get(args.workoutId);
    if (!workout || workout.userId !== args.userId) {
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
  args: { userId: v.string() },
  returns: v.object({
    totalWorkouts: v.number(),
    totalMinutes: v.number(),
    thisWeekWorkouts: v.number(),
    currentStreak: v.number(),
  }),
  handler: async (ctx, args) => {
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
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

export const getWeeklyProgress = authQuery({
  args: { userId: v.string(), weeklyGoal: v.number() },
  returns: v.object({
    completedThisWeek: v.number(),
    weeklyGoal: v.number(),
    percentComplete: v.number(),
    daysWithWorkouts: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    const now = new Date();
    // Get start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const thisWeekWorkouts = workouts.filter(
      (w) => w.completed && w.date >= startOfWeek.getTime()
    );

    // Get unique days with workouts (0 = Sunday, 6 = Saturday)
    const daysWithWorkouts = [...new Set(
      thisWeekWorkouts.map((w) => new Date(w.date).getDay())
    )].sort();

    const completedThisWeek = thisWeekWorkouts.length;
    const percentComplete = Math.min(100, Math.round((completedThisWeek / args.weeklyGoal) * 100));

    return {
      completedThisWeek,
      weeklyGoal: args.weeklyGoal,
      percentComplete,
      daysWithWorkouts,
    };
  },
});

export const getWorkoutSuggestions = authQuery({
  args: { userId: v.string() },
  returns: v.array(v.object({
    category: v.string(),
    daysSinceLastWorkout: v.number(),
    suggestion: v.string(),
  })),
  handler: async (ctx, args) => {
    // Get all exercises from user's workouts
    const workouts = await ctx.db
      .query("workouts")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Get workout categories from exercise templates
    const templates = await ctx.db
      .query("exerciseTemplates")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const categories = [...new Set(templates.map((t) => t.category))];
    
    // Get exercises for each workout to determine categories worked
    const categoryLastWorked: Record<string, number> = {};
    
    for (const workout of workouts) {
      if (!workout.completed) continue;
      
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_workout_id", (q) => q.eq("workoutId", workout._id))
        .collect();

      for (const exercise of exercises) {
        // Find category from template name
        const template = templates.find((t) => t.name === exercise.name);
        if (template) {
          const category = template.category;
          if (!categoryLastWorked[category] || workout.date > categoryLastWorked[category]) {
            categoryLastWorked[category] = workout.date;
          }
        }
      }
    }

    const now = Date.now();
    const suggestions = categories
      .map((category) => {
        const lastWorked = categoryLastWorked[category];
        const daysSince = lastWorked 
          ? Math.floor((now - lastWorked) / (24 * 60 * 60 * 1000))
          : 999; // Never worked

        let suggestion = "";
        if (daysSince >= 7) {
          suggestion = `You haven't done ${category} in over a week!`;
        } else if (daysSince >= 3) {
          suggestion = `It's been ${daysSince} days since your last ${category} workout`;
        } else {
          suggestion = `Last ${category} workout: ${daysSince === 0 ? "Today" : daysSince === 1 ? "Yesterday" : `${daysSince} days ago`}`;
        }

        return {
          category,
          daysSinceLastWorkout: daysSince,
          suggestion,
        };
      })
      .sort((a, b) => b.daysSinceLastWorkout - a.daysSinceLastWorkout)
      .slice(0, 3); // Top 3 suggestions

    return suggestions;
  },
});

