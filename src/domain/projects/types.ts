export const projectStatuses = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export type ProjectStatus = (typeof projectStatuses)[number];

export const projectPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type ProjectPriority = (typeof projectPriorities)[number];

export type Project = {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectDraft = Pick<Project, "organizationId" | "name" | "description" | "priority" | "createdBy"> & {
  status?: ProjectStatus;
};
