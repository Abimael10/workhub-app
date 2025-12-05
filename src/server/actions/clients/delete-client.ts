"use server";

import { requireUser } from "@/server/auth/requireUser";
import { createRequestContext } from "@/server/application/context";
import * as clientsService from "@/server/application/clients/service";

export async function deleteClientAction(id: string) {
  const user = await requireUser();
  const ctx = await createRequestContext(user);

  const deleted = await clientsService.remove(ctx, { id });

  if (!deleted.ok) {
    return { success: false, error: "Cliente no encontrado" };
  }

  return { success: true };
}
