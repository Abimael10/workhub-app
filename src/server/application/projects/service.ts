import { changeProjectStatus, createProjectAggregate } from "@/domain/projects/usecases";
import type { ProjectPriority, ProjectStatus } from "@/domain/projects/types";
import { logger } from "@/lib/logging";
import { invalidateAndPublish } from "@/server/application/realtime";
import {
  createProjectRecord,
  deleteProjectRecord,
  getProjectById,
  listProjectsByOrganization,
  updateProjectRecord,
  updateProjectStatusRecord,
} from "@/server/db/repositories/projects-repo";
import type { RequestContext } from "../types";

type CreateInput = {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
};

type UpdateInput = {
  id: string;
  name?: string;
  description?: string | null;
  priority?: ProjectPriority;
};

export async function list(ctx: RequestContext) {
  return listProjectsByOrganization(ctx.db, ctx.organizationId);
}

export async function create(ctx: RequestContext, input: CreateInput) {
  const aggregate = createProjectAggregate({
    organizationId: ctx.organizationId,
    createdBy: ctx.userId,
    name: input.name,
    description: input.description ?? null,  // Convert to null if it's undefined
    status: input.status ?? "BACKLOG",  // Default status
    priority: input.priority ?? "MEDIUM",  // Default priority
  });

  // Ensure the object matches the database record expectations
  const projectData = {
    ...aggregate,
    description: aggregate.description || null,
  };

  const project = await createProjectRecord(ctx.db, projectData);
  if (!project) {
    throw new Error("Failed to create project record");
  }
  await invalidateAndPublish({ topic: "projects", organizationId: ctx.organizationId, entityId: project.id });
  return project;
}

export async function changeStatus(ctx: RequestContext, input: { id: string; status: ProjectStatus }) {
  const project = await getProjectById(ctx.db, {
    id: input.id,
    organizationId: ctx.organizationId,
  });

  if (!project) {
    logger.warn("Project not found", { domain: "projects", operation: "changeStatus", orgId: ctx.organizationId, meta: { id: input.id, status: input.status } });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  try {
    changeProjectStatus(project, input.status);
  } catch (error) {
    logger.warn("Invalid project status transition", { domain: "projects", operation: "changeStatus", orgId: ctx.organizationId, meta: { from: project.status, to: input.status } }, error);
    return { ok: false as const, error: error instanceof Error ? error.message : "INVALID_TRANSITION" };
  }

  const updated = await updateProjectStatusRecord(ctx.db, {
    id: input.id,
    organizationId: ctx.organizationId,
    status: input.status,
  });

  await invalidateAndPublish({ topic: "projects", organizationId: ctx.organizationId, entityId: input.id });
  return { ok: true as const, project: updated };
}

export async function update(ctx: RequestContext, input: UpdateInput) {
  // Only include fields that are defined
  const updateData = {
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.priority !== undefined && { priority: input.priority }),
  };

  const updated = await updateProjectRecord(ctx.db, {
    id: input.id,
    organizationId: ctx.organizationId,
    data: updateData,
  });

  if (!updated) {
    logger.warn("Project update failed (not found)", { domain: "projects", operation: "update", orgId: ctx.organizationId, meta: { id: input.id } });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await invalidateAndPublish({ topic: "projects", organizationId: ctx.organizationId, entityId: input.id });
  return { ok: true as const, project: updated };
}

export async function remove(ctx: RequestContext, input: { id: string }) {
  const deleted = await deleteProjectRecord(ctx.db, {
    id: input.id,
    organizationId: ctx.organizationId,
  });

  if (!deleted) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await invalidateAndPublish({ topic: "projects", organizationId: ctx.organizationId, entityId: input.id });
  return { ok: true as const };
}