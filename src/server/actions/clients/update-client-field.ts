"use server";

import { requireUser } from "@/server/auth/requireUser";
import { updateClientFieldSchema } from "@/lib/validation/clients";
import { createRequestContext } from "@/server/application/context";
import * as clientsService from "@/server/application/clients/service";

type UpdateClientFieldInput = {
  id: string;
  field: "name" | "type" | "valueDop" | "startDate" | "endDate";
  value: string | number | Date | null;
};

export async function updateClientFieldAction(input: UpdateClientFieldInput) {
  const user = await requireUser();
  const ctx = await createRequestContext(user);
  const parsed = updateClientFieldSchema.parse({
    id: input.id,
    field: input.field,
    value: input.value,
  });

  const result = await clientsService.updateField(ctx, {
    id: parsed.id,
    field: parsed.field,
    value: parsed.value,
  });

  if (!result.ok) {
    return { success: false };
  }

  return { success: true };
}
