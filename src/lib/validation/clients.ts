import { z } from "zod";

export const clientTypeValues = ["PERSON", "COMPANY"] as const;
export const clientTypeSchema = z.enum(clientTypeValues);

export const clientSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  createdBy: z.uuid(),
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  type: clientTypeSchema,
  valueDop: z.string().transform((val) => Number(val || 0)), // Transform to number
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const listClientsSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  search: z.string().max(255, "Search query must be at most 255 characters").optional(),
});

export const updateClientFieldSchema = z.object({
  id: z.uuid(),
  field: z.enum(["name", "type", "valueDop", "startDate", "endDate"]),
  value: z.union([z.string(), z.number(), z.null()]),
});

// Validation for creating new clients
export const createClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters"),
  type: clientTypeSchema,
  valueDop: z.string().optional().default("0"),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// Validation for updating clients
export const updateClientSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be at most 255 characters").optional(),
  type: clientTypeSchema.optional(),
  valueDop: z.string().optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// Validation for batch operations
export const batchDeleteClientsSchema = z.object({
  ids: z.array(z.uuid()).min(1, "At least one client ID is required").max(100, "Maximum 100 clients can be deleted at once"),
});