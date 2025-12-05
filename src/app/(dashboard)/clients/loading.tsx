import { RouteLoadingSkeleton } from "@/ui/components/layout/RouteLoadingSkeleton";

export default function ClientsLoading() {
  return (
    <RouteLoadingSkeleton
      title="Clientes"
      description="Obteniendo registros..."
    />
  );
}
