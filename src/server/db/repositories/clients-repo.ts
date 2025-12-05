import { and, count, eq, ilike } from "drizzle-orm";
import type { Database } from "@/server/db";
import { clients, type ClientModel } from "@/server/db/schema/clients";

type PaginateParams = {
  organizationId: string;
  page: number;
  pageSize: number;
  search?: string;
};

export async function paginateClients(db: Database, params: PaginateParams) {
  const offset = (params.page - 1) * params.pageSize;
  const where = params.search
    ? and(
        eq(clients.organizationId, params.organizationId),
        ilike(clients.name, `%${params.search}%`)
      )
    : eq(clients.organizationId, params.organizationId);

  const [items, totalRecords] = await Promise.all([
    db.query.clients.findMany({
      where: (fields, { and, eq, ilike }) =>
        params.search
          ? and(
              eq(fields.organizationId, params.organizationId),
              ilike(fields.name, `%${params.search}%`)
            )
          : eq(fields.organizationId, params.organizationId),
      limit: params.pageSize,
      offset,
      orderBy: (fields, { asc }) => [asc(fields.name)],
      with: {
        creator: {
          columns: { id: true, name: true, email: true },
        },
      },
    }),
    db
      .select({ value: count() })
      .from(clients)
      .where(where),
  ]);

  const total = totalRecords[0]?.value ?? 0;

  return { items, total };
}

export async function createClientRecord(
  db: Database,
  params: {
    organizationId: string;
    name: string;
    type: ClientModel["type"];
    valueDop: string | number;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    createdBy: string;
  },
) {
  const [record] = await db
    .insert(clients)
    .values({
      organizationId: params.organizationId,
      name: params.name,
      type: params.type,
      valueDop: params.valueDop.toString(),
      startDate: params.startDate ?? null,
      endDate: params.endDate ?? null,
      createdBy: params.createdBy,
    } as any)
    .returning();

  return record;
}

export async function updateClientField(
  db: Database,
  params: {
    organizationId: string;
    id: string;
    field: keyof Pick<ClientModel, "name" | "type" | "valueDop" | "startDate" | "endDate">;
    value: string | number | Date | null;
  },
) {
  const payload: Partial<ClientModel> = {
    [params.field]: params.value as never,
    updatedAt: new Date(),
  };

  const [updated] = await db
    .update(clients)
    .set(payload)
    .where(and(eq(clients.organizationId, params.organizationId), eq(clients.id, params.id)))
    .returning();

  return updated;
}

export async function deleteClientRecord(db: Database, params: { organizationId: string; id: string }) {
  // First, fetch the client to return if it exists
  const clientToDelete = await db.query.clients.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.id, params.id), eq(fields.organizationId, params.organizationId)),
  });

  if (!clientToDelete) {
    return null;
  }

  // Perform the actual deletion
  await db
    .delete(clients)
    .where(and(eq(clients.organizationId, params.organizationId), eq(clients.id, params.id)));

  return clientToDelete;
}