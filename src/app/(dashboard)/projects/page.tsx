import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { requireUser } from "@/server/auth/requireUser";
import { createDashboardMetadata } from "@/lib/metadata";
import { listProjectsByOrganization } from "@/server/db/repositories/projects-repo";
import { db } from "@/server/db";

// Dynamically import the Kanban board to handle client-side rendering
const ProjectsView = dynamic(() => import("./ProjectsView"), {
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-3xl border border-white/10">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
    </div>
  ),
});

export const runtime = "nodejs";

export const metadata: Metadata = createDashboardMetadata({
  title: "Proyectos",
  description: "Columnas Kanban con drag and drop.",
  path: "/projects",
});

export default async function ProjectsPage() {
  const user = await requireUser();

  // Preload projects data to pass to the client component
  const projects = await listProjectsByOrganization(db, user.organizationId);

  return <ProjectsView initialProjects={projects ?? []} />;
}