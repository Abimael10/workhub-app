"use server";

import { z } from "zod";
import { requireUser } from "@/server/auth/requireUser";
import { clientTypeSchema } from "@/lib/validation/clients";
import { createRequestContext } from "@/server/application/context";
import * as clientsService from "@/server/application/clients/service";

const formSchema = z.object({
  name: z.string().min(2),
  type: clientTypeSchema,
  valueDop: z.coerce.number().min(0),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export type CreateClientActionResult = {
  success?: boolean;
  error?: string;
};

export async function createClientAction(
  _prevState: CreateClientActionResult,
  formData: FormData,
): Promise<CreateClientActionResult> {
  const user = await requireUser();
  const ctx = await createRequestContext(user);
  const payload = {
    name: formData.get("name"),
    type: formData.get("type"),
    valueDop: formData.get("valueDop"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  };

  const parsed = formSchema.safeParse({
    name: typeof payload.name === "string" ? payload.name : "",
    type: typeof payload.type === "string" ? payload.type : "PERSON",
    valueDop: payload.valueDop ?? "0",
    startDate: typeof payload.startDate === "string" ? payload.startDate : "",
    endDate: typeof payload.endDate === "string" ? payload.endDate : "",
  });

  if (!parsed.success) {
    return { error: "Completa todos los campos requeridos." };
  }

  try {
    await clientsService.create(ctx, {
      name: parsed.data.name,
      type: parsed.data.type,
      valueDop: parsed.data.valueDop,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
    });
    return { success: true };
  } catch (error) {
    console.error("[clients] create action failed", error);
    return { error: "No se pudo crear el cliente. Intenta de nuevo." };
  }
}
