"use server";

import { requireUser } from "@/server/auth/requireUser";
import type { ProjectStatus } from "@/domain/projects/types";
import { createRequestContext } from "@/server/application/context";
import * as projectsService from "@/server/application/projects/service";

export async function changeProjectStatusAction(params: { id: string; status: ProjectStatus }) {
  const user = await requireUser();
  const ctx = await createRequestContext(user);
  const result = await projectsService.changeStatus(ctx, params);

  if (!result.ok) {
    return { success: false, error: result.error === "NOT_FOUND" ? "Proyecto no encontrado" : result.error };
  }

  return { success: true };
}
