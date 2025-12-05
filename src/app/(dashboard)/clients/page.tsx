import type { Metadata } from "next";
import { requireUser } from "@/server/auth/requireUser";
import { getClientsPageSnapshot } from "@/server/queries/dashboard";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import { ClientsTable } from "@/ui/components/clients/ClientsTable";
import { Tag } from "@/ui/components/common/Tag";
import { createDashboardMetadata } from "@/lib/metadata";

export const runtime = "nodejs";

export const metadata: Metadata = createDashboardMetadata({
  title: "Clientes",
  description: "Cuadrícula CRM con paginación, filtros y actualizaciones.",
  path: "/clients",
});

export default async function ClientsPage() {
  const user = await requireUser();
  const initialPage = await getClientsPageSnapshot({
    organizationId: user.organizationId,
    page: 1,
    pageSize: CLIENTS_PAGE_SIZE,
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Relaciones</p>
          <h1 className="mt-2 font-display text-3xl text-white">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Sigue a cada cliente con ediciones en línea, filtros y paginación.
          </p>
        </div>
        <Tag>Cuadrícula de datos</Tag>
      </div>
      <ClientsTable initialPage={initialPage} />
    </section>
  );
}
