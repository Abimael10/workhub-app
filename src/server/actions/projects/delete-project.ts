"use server";

import { requireUser } from "@/server/auth/requireUser";
import { createRequestContext } from "@/server/application/context";
import * as projectsService from "@/server/application/projects/service";

export async function deleteProjectAction(id: string) {
  const user = await requireUser();
  const ctx = await createRequestContext(user);

  const deleted = await projectsService.remove(ctx, { id });

  if (!deleted.ok) {
    return { success: false, error: "Proyecto no encontrado" };
  }

  return { success: true };
}
