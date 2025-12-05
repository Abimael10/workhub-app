"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/ui/components/common/Button";
import { cn } from "@/lib/utils";

type Props = {
  organizationName: string;
};

export default function DeleteAccountForm({ organizationName }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canDelete = confirmText === "DELETE";

  const handleDelete = () => {
    startTransition(async () => {
      setError(null);
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmText }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? "No se pudo eliminar la cuenta.");
        return;
      }

      router.push("/login");
      router.refresh();
    });
  };

  return (
    <div className="rounded-3xl border border-destructive/50 bg-[#1b0f13] p-6 text-white shadow-inner shadow-destructive/25">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-full bg-destructive/30 p-2 text-destructive-foreground">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-destructive">Zona de peligro</p>
          <h2 className="text-xl font-semibold text-white">Eliminar cuenta y datos</h2>
          <p className="text-sm text-white/90">
            Esta acción eliminará tu cuenta, la organización “{organizationName}” y todos los proyectos, clientes y archivos asociados. No se
            puede deshacer.
          </p>

          
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="block text-sm text-muted-foreground">
          
          Escribe <span className="font-semibold text-white">DELETE</span> para confirmar.
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-destructive focus:ring-2 focus:ring-destructive/40"
            placeholder="DELETE"
          />
        </label>
        {error && <p className="text-sm text-destructive-foreground">{error}</p>}
        <Button
          onClick={handleDelete}
          disabled={!canDelete || isPending}
          className={cn(
            "w-full border border-destructive/60 bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/60",
          )}
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Eliminando…
            </span>
          ) : (
            "Eliminar cuenta y datos"
          )}
        </Button>
      </div>
    </div>
  );
}
