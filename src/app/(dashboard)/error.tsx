"use client";

import { useEffect } from "react";
import { Button } from "@/ui/components/common/Button";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to console; server-side logging already captures via services.
    console.error("[dashboard] client error boundary", error);
  }, [error]);

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center text-foreground">
      <div className="text-lg font-semibold text-white">Algo salió mal en el panel</div>
      <p className="text-sm text-muted-foreground">
        {"Intenta recargar o volver al inicio mientras investigamos el problema."}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = "/projects")}>
          Ir a proyectos
        </Button>
      </div>
      {error?.digest && (
        <p className="text-xs text-muted-foreground">Referencia: {error.digest}</p>
      )}
    </div>
  );
}
