import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for profile image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update user profile with image
export const updateProfileImage = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete old profile image if exists
    if (user.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }

    // Get the URL for the new image
    const imageUrl = await ctx.storage.getUrl(args.storageId);

    // Update user with new image
    await ctx.db.patch(args.userId, {
      profileImageId: args.storageId,
      profileImageUrl: imageUrl ?? undefined,
    });

    return { success: true, imageUrl };
  },
});

// Remove profile image
export const removeProfileImage = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete the image from storage
    if (user.profileImageId) {
      await ctx.storage.delete(user.profileImageId);
    }

    // Remove image references from user
    await ctx.db.patch(args.userId, {
      profileImageId: undefined,
      profileImageUrl: undefined,
    });

    return { success: true };
  },
});

// Update user profile data
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    fitnessGoal: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    gender: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...profileData } = args;
    
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined values
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(profileData)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }

    await ctx.db.patch(userId, updates);

    return { success: true };
  },
});

// Get full user profile
export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      displayName: user.displayName,
      profileImageUrl: user.profileImageUrl,
      bio: user.bio,
      fitnessGoal: user.fitnessGoal,
      birthDate: user.birthDate,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      createdAt: user.createdAt,
    };
  },
});
