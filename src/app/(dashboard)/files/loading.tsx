import { RouteLoadingSkeleton } from "@/ui/components/layout/RouteLoadingSkeleton";

export default function FilesLoading() {
  return (
    <RouteLoadingSkeleton
      title="Archivos"
      description="Preparando archivos..."
    />
  );
}
