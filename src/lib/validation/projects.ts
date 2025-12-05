import { z } from "zod";

export const projectStatuses = ["BACKLOG", "IN_PROGRESS", "BLOCKED", "DONE"] as const;
export const projectPriorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export const projectStatusSchema = z.enum(projectStatuses);
export const projectPrioritySchema = z.enum(projectPriorities);

export const projectSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  createdBy: z.uuid(),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  description: z.string().max(1000, "Description must be at most 1000 characters").nullable(),
  status: projectStatusSchema,
  priority: projectPrioritySchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const changeProjectStatusSchema = z.object({
  id: z.uuid(),
  status: projectStatusSchema,
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional().nullable(),
  priority: projectPrioritySchema.optional().default("MEDIUM"),
  status: projectStatusSchema.optional().default("BACKLOG"),
});

// Validation for updating projects
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters").optional(),
  description: z.string().max(1000, "Description must be at most 1000 characters").optional().nullable(),
  priority: projectPrioritySchema.optional(),
});

// Validation for batch operations
export const batchDeleteProjectsSchema = z.object({
  ids: z.array(z.uuid()).min(1, "At least one project ID is required").max(100, "Maximum 100 projects can be deleted at once"),
});
