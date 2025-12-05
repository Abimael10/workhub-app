"use client";

import { RouteErrorState } from "@/ui/components/layout/RouteErrorState";

type ClientsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ClientsError({ error, reset }: ClientsErrorProps) {
  return <RouteErrorState title="Clientes" error={error} reset={reset} />;
}
