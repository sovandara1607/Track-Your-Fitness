import { mutation } from "./_generated/server";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").first();
    if (existingUsers) {
      return { message: "Database already seeded" };
    }

    // Create demo user
    const demoUserId = await ctx.db.insert("users", {
      email: "demo@lift.app",
      password: "demo123",
      name: "Demo User",
      createdAt: Date.now(),
    });

    // Create another user
    const user2Id = await ctx.db.insert("users", {
      email: "john@fitness.com",
      password: "password123",
      name: "John Doe",
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    });

    // Create exercise templates
    const templates = [
      // Chest exercises
      { name: "Bench Press", category: "Chest", defaultSets: 4, defaultReps: 8, defaultWeight: 135 },
      { name: "Incline Dumbbell Press", category: "Chest", defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
      { name: "Cable Flyes", category: "Chest", defaultSets: 3, defaultReps: 12, defaultWeight: 40 },
      { name: "Push Ups", category: "Chest", defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
      
      // Back exercises
      { name: "Deadlift", category: "Back", defaultSets: 4, defaultReps: 6, defaultWeight: 225 },
      { name: "Pull Ups", category: "Back", defaultSets: 4, defaultReps: 8, defaultWeight: 0 },
      { name: "Barbell Rows", category: "Back", defaultSets: 4, defaultReps: 8, defaultWeight: 135 },
      { name: "Lat Pulldown", category: "Back", defaultSets: 3, defaultReps: 10, defaultWeight: 120 },
      
      // Legs exercises
      { name: "Squats", category: "Legs", defaultSets: 4, defaultReps: 8, defaultWeight: 185 },
      { name: "Leg Press", category: "Legs", defaultSets: 4, defaultReps: 10, defaultWeight: 270 },
      { name: "Romanian Deadlift", category: "Legs", defaultSets: 3, defaultReps: 10, defaultWeight: 135 },
      { name: "Leg Curls", category: "Legs", defaultSets: 3, defaultReps: 12, defaultWeight: 70 },
      { name: "Calf Raises", category: "Legs", defaultSets: 4, defaultReps: 15, defaultWeight: 100 },
      
      // Shoulders exercises
      { name: "Overhead Press", category: "Shoulders", defaultSets: 4, defaultReps: 8, defaultWeight: 95 },
      { name: "Lateral Raises", category: "Shoulders", defaultSets: 3, defaultReps: 12, defaultWeight: 20 },
      { name: "Face Pulls", category: "Shoulders", defaultSets: 3, defaultReps: 15, defaultWeight: 50 },
      
      // Arms exercises
      { name: "Barbell Curl", category: "Arms", defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
      { name: "Tricep Dips", category: "Arms", defaultSets: 3, defaultReps: 10, defaultWeight: 0 },
      { name: "Hammer Curls", category: "Arms", defaultSets: 3, defaultReps: 12, defaultWeight: 35 },
      { name: "Skull Crushers", category: "Arms", defaultSets: 3, defaultReps: 10, defaultWeight: 50 },
      
      // Core exercises
      { name: "Plank", category: "Core", defaultSets: 3, defaultReps: 60, defaultWeight: 0 },
      { name: "Russian Twists", category: "Core", defaultSets: 3, defaultReps: 20, defaultWeight: 25 },
      { name: "Hanging Leg Raises", category: "Core", defaultSets: 3, defaultReps: 12, defaultWeight: 0 },
    ];

    for (const template of templates) {
      await ctx.db.insert("exerciseTemplates", {
        userId: demoUserId.toString(),
        ...template,
      });
    }

    // Create workouts for demo user
    const now = Date.now();
    const workouts = [
      // Week 1
      { name: "Chest & Triceps", date: now - 6 * 24 * 60 * 60 * 1000, duration: 65, completed: true },
      { name: "Back & Biceps", date: now - 5 * 24 * 60 * 60 * 1000, duration: 70, completed: true },
      { name: "Legs", date: now - 4 * 24 * 60 * 60 * 1000, duration: 80, completed: true },
      { name: "Shoulders & Arms", date: now - 3 * 24 * 60 * 60 * 1000, duration: 55, completed: true },
      
      // Week 2
      { name: "Push Day", date: now - 2 * 24 * 60 * 60 * 1000, duration: 75, completed: true },
      { name: "Pull Day", date: now - 1 * 24 * 60 * 60 * 1000, duration: 68, completed: true },
      { name: "Leg Day", date: now, duration: 45, completed: false },
    ];

    for (const workout of workouts) {
      const workoutId = await ctx.db.insert("workouts", {
        userId: demoUserId.toString(),
        ...workout,
      });

      // Add exercises to each workout
      if (workout.name.includes("Chest")) {
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Bench Press",
          order: 0,
          sets: [
            { reps: 8, weight: 135, completed: true },
            { reps: 8, weight: 155, completed: true },
            { reps: 6, weight: 175, completed: true },
            { reps: 5, weight: 185, completed: true },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Incline Dumbbell Press",
          order: 1,
          sets: [
            { reps: 10, weight: 60, completed: true },
            { reps: 10, weight: 65, completed: true },
            { reps: 8, weight: 70, completed: true },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Tricep Dips",
          order: 2,
          sets: [
            { reps: 12, weight: 0, completed: true },
            { reps: 10, weight: 0, completed: true },
            { reps: 8, weight: 0, completed: true },
          ],
        });
      }

      if (workout.name.includes("Back")) {
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Deadlift",
          order: 0,
          sets: [
            { reps: 8, weight: 185, completed: true },
            { reps: 6, weight: 225, completed: true },
            { reps: 5, weight: 245, completed: true },
            { reps: 3, weight: 275, completed: true },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Pull Ups",
          order: 1,
          sets: [
            { reps: 10, weight: 0, completed: true },
            { reps: 8, weight: 0, completed: true },
            { reps: 7, weight: 0, completed: true },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Barbell Rows",
          order: 2,
          sets: [
            { reps: 10, weight: 135, completed: true },
            { reps: 8, weight: 155, completed: true },
            { reps: 8, weight: 155, completed: true },
          ],
        });
      }

      if (workout.name.includes("Leg")) {
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Squats",
          order: 0,
          sets: [
            { reps: 10, weight: 135, completed: workout.completed },
            { reps: 8, weight: 185, completed: workout.completed },
            { reps: 6, weight: 205, completed: workout.completed },
            { reps: 5, weight: 225, completed: workout.completed },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Leg Press",
          order: 1,
          sets: [
            { reps: 12, weight: 270, completed: workout.completed },
            { reps: 10, weight: 315, completed: workout.completed },
            { reps: 10, weight: 315, completed: workout.completed },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Leg Curls",
          order: 2,
          sets: [
            { reps: 12, weight: 70, completed: workout.completed },
            { reps: 12, weight: 80, completed: false },
            { reps: 10, weight: 80, completed: false },
          ],
        });
      }

      if (workout.name.includes("Shoulders") || workout.name.includes("Push")) {
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Overhead Press",
          order: 0,
          sets: [
            { reps: 10, weight: 75, completed: true },
            { reps: 8, weight: 95, completed: true },
            { reps: 6, weight: 105, completed: true },
          ],
        });
        await ctx.db.insert("exercises", {
          userId: demoUserId.toString(),
          workoutId,
          name: "Lateral Raises",
          order: 1,
          sets: [
            { reps: 12, weight: 20, completed: true },
            { reps: 12, weight: 25, completed: true },
            { reps: 10, weight: 25, completed: true },
          ],
        });
      }
    }

    // Create personal records
    await ctx.db.insert("personalRecords", {
      userId: demoUserId.toString(),
      exerciseName: "Bench Press",
      maxWeight: 225,
      maxReps: 1,
      date: now - 10 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("personalRecords", {
      userId: demoUserId.toString(),
      exerciseName: "Squat",
      maxWeight: 315,
      maxReps: 1,
      date: now - 5 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("personalRecords", {
      userId: demoUserId.toString(),
      exerciseName: "Deadlift",
      maxWeight: 405,
      maxReps: 1,
      date: now - 15 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Database seeded successfully!",
      users: 2,
      templates: templates.length,
      workouts: workouts.length,
      demoEmail: "demo@lift.app",
      demoPassword: "demo123",
    };
  },
});
