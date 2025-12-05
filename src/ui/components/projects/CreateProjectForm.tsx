"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { createProjectAction, type CreateProjectActionResult } from "@/server/actions/projects/create-project";
import { projectPriorities, projectStatuses } from "@/lib/validation/projects";
import { Button } from "@/ui/components/common/Button";

const initialState: CreateProjectActionResult = { success: false };

const statusLabels: Record<(typeof projectStatuses)[number], string> = {
  BACKLOG: "Pendiente",
  IN_PROGRESS: "En progreso",
  BLOCKED: "Bloqueado",
  DONE: "Completado",
};

const priorityLabels: Record<(typeof projectPriorities)[number], string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

export function CreateProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [state, formAction] = useActionState<CreateProjectActionResult, FormData>(
    createProjectAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5" aria-live="polite">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="project-name">
          Nombre del proyecto
        </label>
        <input
          id="project-name"
          name="name"
          required
          placeholder="Experimentos de crecimiento"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="project-description">
          Descripción
        </label>
        <textarea
          id="project-description"
          name="description"
          required
          rows={3}
          placeholder="Esboza el alcance o los criterios de éxito..."
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="project-status">
          Estado
        </label>
        <select
          id="project-status"
          name="status"
          defaultValue="BACKLOG"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {projectStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="project-priority">
          Prioridad
        </label>
        <select
          id="project-priority"
          name="priority"
          defaultValue="MEDIUM"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {projectPriorities.map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <SubmitButton />
        <DialogPrimitive.Close asChild>
          <Button type="button" variant="ghost" className="flex-1 justify-center">
            Cancelar
          </Button>
        </DialogPrimitive.Close>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-400">Proyecto creado. Aparecerá en tu tablero.</p>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full justify-center">
      {pending ? "Creando..." : "Crear proyecto"}
    </Button>
  );
}
