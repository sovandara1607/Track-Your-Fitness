

import { action, mutation, query } from "./_generated/server";

// For now, these are pass-through wrappers
// In the future, we can add authentication middleware here
export const authQuery = query;
export const authMutation = mutation;
export const authAction = action;
