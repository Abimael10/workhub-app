import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { files, type FileModel } from "@/server/db/schema/files";

export async function listFiles(db: Database, organizationId: string) {
  return db.query.files.findMany({
    where: (fields, { eq }) => eq(fields.organizationId, organizationId),
    orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    with: {
      creator: {
        columns: { id: true, name: true, email: true },
      },
    },
  });
}

export async function registerFileRecord(
  db: Database,
  payload: Omit<FileModel, "id" | "createdAt" | "updatedAt">,
) {
  const [record] = await db
    .insert(files)
    .values(payload)
    .returning();

  return record;
}

export async function deleteFileRecord(
  db: Database,
  params: { id: string; organizationId: string; storageKey?: string },
) {
  // First, fetch the file to return if it exists
  const fileToDelete = await db.query.files.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.id, params.id), eq(fields.organizationId, params.organizationId)),
  });

  if (!fileToDelete) {
    return null;
  }

  // Optionally check storage key match
  if (params.storageKey && fileToDelete.storageKey !== params.storageKey) {
    return null; // Indicate that deletion shouldn't happen
  }

  // Perform the actual deletion
  await db
    .delete(files)
    .where(and(eq(files.id, params.id), eq(files.organizationId, params.organizationId)));

  return fileToDelete;
}

export async function getFileById(db: Database, params: { id: string; organizationId: string }) {
  return db.query.files.findFirst({
    where: (fields, { and, eq }) => and(eq(fields.id, params.id), eq(fields.organizationId, params.organizationId)),
  });
}

export async function getFileByStorageKey(
  db: Database,
  params: { storageKey: string; organizationId: string },
) {
  return db.query.files.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.storageKey, params.storageKey), eq(fields.organizationId, params.organizationId)),
  });
}