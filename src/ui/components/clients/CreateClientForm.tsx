"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { createClientAction, type CreateClientActionResult } from "@/server/actions/clients/create-client";
import { clientTypeValues } from "@/lib/validation/clients";
import { Button } from "@/ui/components/common/Button";

const initialState: CreateClientActionResult = { success: false };

type CreateClientFormProps = {
  onCreated?: () => void;
};

const clientTypeLabels: Record<(typeof clientTypeValues)[number], string> = {
  PERSON: "Persona",
  COMPANY: "Empresa",
};

export function CreateClientForm({ onCreated }: CreateClientFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState<CreateClientActionResult, FormData>(createClientAction, initialState);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      onCreated?.();
    }
  }, [onCreated, state.success]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="client-name">
          Nombre
        </label>
        <input
          id="client-name"
          name="name"
          required
          placeholder="Acme Corporation"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="client-type">
          Tipo
        </label>
        <select
          id="client-type"
          name="type"
          defaultValue="COMPANY"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          {clientTypeValues.map((type) => (
            <option key={type} value={type}>
              {clientTypeLabels[type]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-white" htmlFor="client-value">
          Valor del contrato (DOP)
        </label>
        <input
          id="client-value"
          name="valueDop"
          type="number"
          min={0}
          step="0.01"
          required
          placeholder="150000"
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="client-start">
            Fecha de inicio
          </label>
          <input
            id="client-start"
            name="startDate"
            type="date"
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white" htmlFor="client-end">
            Fecha de cierre
          </label>
          <input
            id="client-end"
            name="endDate"
            type="date"
            required
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
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
      {state.success && <p className="text-sm text-emerald-400">Cliente creado correctamente.</p>}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="flex-1 justify-center">
      {pending ? "Guardando..." : "Guardar cliente"}
    </Button>
  );
}
