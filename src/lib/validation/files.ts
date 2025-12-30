import { z } from "zod";

export const fileSchema = z.object({
  id: z.uuid(),
  organizationId: z.uuid(),
  createdBy: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  mimeType: z.string().nullable(),
  size: z.number(),
  storageKey: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
}).transform((value) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("[files] upload schema input", value);
  }
  return value;
});

export const registerFileSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1, "Description is required"),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
  storageKey: z.string().min(1),
});

// Validation for batch operations
export const batchDeleteFilesSchema = z.object({
  ids: z.array(z.uuid()).min(1, "At least one file ID is required").max(100, "Maximum 100 files can be deleted at once"),
});