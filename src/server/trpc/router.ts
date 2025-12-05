import { createTRPCRouter } from "./trpc";
import { projectsRouter } from "./routers/projects";
import { clientsRouter } from "./routers/clients";
import { filesRouter } from "./routers/files";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  clients: clientsRouter,
  files: filesRouter,
});

export type AppRouter = typeof appRouter;
