/**
 * This file creates the tRPC client and provides type definitions
 * for input and output types of all procedures
 */
"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

/**
 * Main tRPC client instance
 * Used to make API calls from React components
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Type definition for all router inputs
 * Useful for creating type-safe utility functions
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Type definition for all router outputs
 * Useful for creating type-safe utility functions
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
