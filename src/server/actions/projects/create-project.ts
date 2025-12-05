"use server";

import { requireUser } from "@/server/auth/requireUser";
import { createProjectSchema } from "@/lib/validation/projects";
import { createRequestContext } from "@/server/application/context";
import * as projectsService from "@/server/application/projects/service";

const formSchema = createProjectSchema.pick({ name: true, description: true, priority: true, status: true });

export type CreateProjectActionResult = {
  success?: boolean;
  error?: string;
};

export async function createProjectAction(
  _prevState: CreateProjectActionResult,
  formData: FormData,
): Promise<CreateProjectActionResult> {
  const user = await requireUser();
  const ctx = await createRequestContext(user);
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    status: formData.get("status"),
  };

  const parsed = formSchema.safeParse({
    name: typeof raw.name === "string" ? raw.name : "",
    description: (typeof raw.description === "string" && raw.description !== "") ? raw.description : undefined,
    priority: typeof raw.priority === "string" ? raw.priority : "MEDIUM",
    status: typeof raw.status === "string" ? raw.status : "BACKLOG",
  });

  if (!parsed.success) {
    return { error: "Proporciona un nombre de proyecto y elige una prioridad." };
  }

  try {
    const projectData = {
      name: parsed.data.name,
      status: parsed.data.status,
      priority: parsed.data.priority,
    } as const;

    if (parsed.data.description) {
      await projectsService.create(ctx, {
        ...projectData,
        description: parsed.data.description,
      });
    } else {
      await projectsService.create(ctx, projectData);
    }

    return { success: true };
  } catch (error) {
    console.error("[projects] createProjectAction failed", error);
    return { error: "No se pudo crear el proyecto. Intenta de nuevo." };
  }
}
