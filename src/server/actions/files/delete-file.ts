"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/requireUser";
import { createStorageRequestContext } from "@/server/application/context";
import { deleteFile as deleteFileUsecase } from "@/server/application/files/service";

export async function deleteFileAction(id: string, storageKey?: string) {
  try {
    const user = await requireUser();
    const ctx = await createStorageRequestContext(user);

    const result = await deleteFileUsecase(ctx, {
      id,
      ...(storageKey !== undefined && { storageKey }),
    });

    if (result.ok) {
      // In Next.js 16, revalidation might happen automatically or via router.refresh() on client
      return { success: true as const };
    } else {
      return { success: false as const, error: result.error };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, error: "INVALID_INPUT", details: error.issues };
    }
    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false as const, error: "UNKNOWN_ERROR", details: errorMessage };
  }
}