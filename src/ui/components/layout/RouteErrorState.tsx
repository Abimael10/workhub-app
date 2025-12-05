"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/ui/components/common/Button";

type RouteErrorStateProps = {
  title: string;
  error: Error & { digest?: string };
  reset: () => void;
};

export function RouteErrorState({ title, error, reset }: RouteErrorStateProps) {
  useEffect(() => {
    console.error(`[${title}] ruta falló`, error);
  }, [error, title]);

  return (
    <section className="space-y-4 rounded-3xl border border-destructive/40 bg-destructive/10 p-8 shadow-glow">
      <div>
        <p className="font-display text-2xl text-white">{title} temporalmente no disponible</p>
        <p className="mt-2 text-sm text-destructive-foreground">
          {error.message || "Algo salió mal al cargar esta sección."}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Intentar de nuevo
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          Actualizar página
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-destructive/70">Referencia del error: {error.digest}</p>
      )}
    </section>
  );
}
