import { registerFile } from "@/domain/files/usecases";
import { logger } from "@/lib/logging";
import { invalidateAndPublish } from "@/server/application/realtime";
import {
  deleteFileRecord,
  getFileByStorageKey,
  listFiles,
  registerFileRecord,
} from "@/server/db/repositories/files-repo";
import type { StorageRequestContext } from "../types";

type RegisterInput = {
  name: string;
  description: string;
  mimeType: string;
  size: number;
  storageKey: string;
};

export function list(ctx: StorageRequestContext) {
  return listFiles(ctx.db, ctx.organizationId);
}

export async function registerUpload(ctx: StorageRequestContext, input: RegisterInput) {
  const aggregate = registerFile({
    organizationId: ctx.organizationId,
    createdBy: ctx.userId,
    name: input.name,
    description: input.description,
    mimeType: input.mimeType,
    size: input.size,
    storageKey: input.storageKey,
  });

  // Ensure the object matches the database record expectations
  const recordData = {
    ...aggregate,
    description: aggregate.description || null,
    mimeType: aggregate.mimeType || input.mimeType,
    size: aggregate.size || input.size,
  };

  const record = await registerFileRecord(ctx.db, recordData);
  if (!record) {
    throw new Error("Failed to register file record");
  }
  await invalidateAndPublish({ topic: "files", organizationId: ctx.organizationId, entityId: record.id });
  return record;
}

export async function deleteFile(ctx: StorageRequestContext, input: { id: string; storageKey?: string }) {
  try {
    const deleteParams = {
      id: input.id,
      organizationId: ctx.organizationId,
      ...(input.storageKey !== undefined && { storageKey: input.storageKey }),
    };
    const deleted = await deleteFileRecord(ctx.db, deleteParams);

    if (!deleted) {
      logger.warn("File not found", {
        domain: "files",
        operation: "delete",
        orgId: ctx.organizationId,
        meta: { id: input.id },
      });
      return { ok: false as const, error: "NOT_FOUND" as const };
    }

    if (input.storageKey && deleted.storageKey !== input.storageKey) {
      logger.warn("File storage key mismatch", {
        domain: "files",
        operation: "delete",
        orgId: ctx.organizationId,
        meta: { id: input.id, expected: deleted.storageKey, received: input.storageKey },
      });
      return { ok: false as const, error: "MISMATCH" as const };
    }

    // Attempt to delete the storage object
    try {
      await ctx.storage.deleteObject(deleted.storageKey);
    } catch (error) {
      logger.error("Failed to delete storage object", {
        domain: "files",
        operation: "delete",
        orgId: ctx.organizationId,
        meta: { id: input.id, storageKey: deleted.storageKey },
      }, error instanceof Error ? error : new Error(String(error)));
      // Continue with invalidation even if storage deletion failed
      // Still return success since the file record was deleted from the database
    }

    // Invalidate the cache
    try {
      await invalidateAndPublish({ topic: "files", organizationId: ctx.organizationId, entityId: input.id });
    } catch (error) {
      logger.error("Failed to invalidate file after deletion", {
        domain: "files",
        operation: "delete",
        orgId: ctx.organizationId,
        meta: { id: input.id, storageKey: deleted.storageKey },
      }, error instanceof Error ? error : new Error(String(error)));
      // Still return success even if invalidation failed
    }

    return { ok: true as const };
  } catch (error) {
    logger.error("Unexpected error in deleteFile service", {
      domain: "files",
      operation: "delete",
      orgId: ctx.organizationId,
      meta: { id: input.id, storageKey: input.storageKey },
    }, error instanceof Error ? error : new Error(String(error)));
    return { ok: false as const, error: "INTERNAL_ERROR" as const };
  }
}

export async function getDownloadUrl(ctx: StorageRequestContext, storageKey: string) {
  const record = await getFileByStorageKey(ctx.db, {
    organizationId: ctx.organizationId,
    storageKey,
  });

  if (!record) {
    logger.warn("Download attempted for missing file", {
      domain: "files",
      operation: "downloadUrl",
      orgId: ctx.organizationId,
      meta: { storageKey },
    });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const url = await ctx.storage.getDownloadUrl(record.storageKey);
  return { ok: true as const, url };
}