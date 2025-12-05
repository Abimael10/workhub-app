import { assertTransition } from "./status-machine";
import type { Project, ProjectDraft, ProjectPriority, ProjectStatus } from "./types";

export function createProjectAggregate(draft: ProjectDraft): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    ...draft,
    description: draft.description ?? "",
    status: draft.status ?? "BACKLOG",
    priority: draft.priority ?? ("MEDIUM" as ProjectPriority),
  };
}

export function changeProjectStatus(project: Project, status: ProjectStatus): Project {
  assertTransition(project.status, status);
  return {
    ...project,
    status,
    updatedAt: new Date(),
  };
}

export function sortProjects(projects: Project[]) {
  const statusWeight: Record<ProjectStatus, number> = {
    BACKLOG: 0,
    IN_PROGRESS: 1,
    BLOCKED: 2,
    DONE: 3,
  };

  const priorityWeight: Record<ProjectPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  return [...projects].sort((a, b) => {
    // First sort by status (business-defined order)
    if (a.status !== b.status) {
      return statusWeight[a.status] - statusWeight[b.status];
    }
    // Within same status, sort by priority
    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });
}
