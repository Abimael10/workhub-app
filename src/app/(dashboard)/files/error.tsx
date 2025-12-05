"use client";

import { RouteErrorState } from "@/ui/components/layout/RouteErrorState";

type FilesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function FilesError({ error, reset }: FilesErrorProps) {
  return <RouteErrorState title="Archivos" error={error} reset={reset} />;
}
