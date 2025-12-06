

import { action, mutation, query } from "./_generated/server";

// Simplified auth helpers - TODO: implement proper auth
// For now, these are just pass-through to regular query/mutation/action
export const authQuery = query;
export const authMutation = mutation;
export const authAction = action;
