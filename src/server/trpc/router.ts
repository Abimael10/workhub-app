/**
 * This file contains the root router of tRPC-backend
 */
import { createTRPCRouter } from "./trpc";
import { projectsRouter } from "./routers/projects";
import { clientsRouter } from "./routers/clients";
import { filesRouter } from "./routers/files";

/**
 * Main application router that combines all individual routers
 * This is the main entry point for all tRPC procedures
 */
export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  clients: clientsRouter,
  files: filesRouter,
});

export type AppRouter = typeof appRouter;
