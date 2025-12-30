/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as chatbot from "../chatbot.js";
import type * as exercises from "../exercises.js";
import type * as functions from "../functions.js";
import type * as http from "../http.js";
import type * as profile from "../profile.js";
import type * as seed from "../seed.js";
import type * as seedExercises from "../seedExercises.js";
import type * as templates from "../templates.js";
import type * as users from "../users.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  chatbot: typeof chatbot;
  exercises: typeof exercises;
  functions: typeof functions;
  http: typeof http;
  profile: typeof profile;
  seed: typeof seed;
  seedExercises: typeof seedExercises;
  templates: typeof templates;
  users: typeof users;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
