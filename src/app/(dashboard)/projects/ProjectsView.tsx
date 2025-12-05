"use client";

import { KanbanBoard } from "@/ui/components/projects/KanbanBoard";
import { ProjectCreateModal } from "@/ui/components/projects/ProjectCreateModal";
import type { RouterOutputs } from "@/lib/trpc/client";

type Project = RouterOutputs["projects"]["list"][number];

type ProjectsViewProps = {
  initialProjects: Project[];
};

export default function ProjectsView({ initialProjects }: ProjectsViewProps) {
  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Pista de proyectos</p>
          <h1 className="mt-2 font-display text-3xl text-white">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            Prioriza con confianza y entrega con claridad.
          </p>
        </div>
        <ProjectCreateModal />
      </div>
      <KanbanBoard initialProjects={initialProjects} />
    </section>
  );
}