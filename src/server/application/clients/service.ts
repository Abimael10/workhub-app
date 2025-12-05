import { updateClientField as updateClientDomain } from "@/domain/clients/usecases";
import type { Client } from "@/domain/clients/types";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import { logger } from "@/lib/logging";
import { invalidateAndPublish } from "@/server/application/realtime";
import {
  createClientRecord,
  deleteClientRecord,
  paginateClients,
  updateClientField as updateClientFieldRecord,
} from "@/server/db/repositories/clients-repo";
import type { RequestContext } from "../types";

type ListParams = {
  page: number;
  pageSize?: number;
  search?: string;
};

type CreateInput = {
  name: string;
  type: "PERSON" | "COMPANY";
  valueDop: number;
  startDate?: string | null;
  endDate?: string | null;
};

type UpdateFieldInput = {
  id: string;
  field: "name" | "type" | "valueDop" | "startDate" | "endDate";
  value: string | number | null | Date;
};

export async function listPage(ctx: RequestContext, params: ListParams) {
  const pageSize = params.pageSize ?? CLIENTS_PAGE_SIZE;
  const paginateParams = {
    organizationId: ctx.organizationId,
    page: params.page,
    pageSize,
    ...(params.search !== undefined && { search: params.search }),
  };

  const result = await paginateClients(ctx.db, paginateParams);

  return {
    ...result,
    page: params.page,
    pageSize,
  };
}

export async function create(ctx: RequestContext, input: CreateInput) {
  const record = await createClientRecord(ctx.db, {
    organizationId: ctx.organizationId,
    createdBy: ctx.userId,
    name: input.name,
    type: input.type,
    valueDop: input.valueDop,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
  });
  if (!record) {
    throw new Error("Failed to create client record");
  }
  await invalidateAndPublish({ topic: "clients", organizationId: ctx.organizationId, entityId: record.id });
  return record;
}

export async function updateField(ctx: RequestContext, input: UpdateFieldInput) {
  const existing = await ctx.db.query.clients.findFirst({
    where: (fields, { and, eq }) =>
      and(eq(fields.organizationId, ctx.organizationId), eq(fields.id, input.id)),
  });

  if (!existing) {
    logger.warn("Client not found", {
      domain: "clients",
      operation: "updateField",
      orgId: ctx.organizationId,
      meta: { id: input.id, field: input.field },
    });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  const domainClient: Client = {
    ...existing,
    valueDop: Number(existing.valueDop ?? 0),
    startDate: existing.startDate ?? null,
    endDate: existing.endDate ?? null,
    type: existing.type,
  };

  const processedValue = input.value instanceof Date ? input.value.toISOString() : input.value;
  const updated = updateClientDomain(domainClient, input.field, processedValue);

  const dbValue =
    input.field === "valueDop"
      ? typeof updated.valueDop === "number"
        ? updated.valueDop
        : Number(updated.valueDop ?? 0)
      : input.field === "startDate" || input.field === "endDate"
        ? updated[input.field] ?? null
        : updated[input.field];

  const saved = await updateClientFieldRecord(ctx.db, {
    organizationId: ctx.organizationId,
    id: input.id,
    field: input.field,
    value: dbValue,
  });

  if (!saved) {
    logger.warn("Client update failed (not found after write)", {
      domain: "clients",
      operation: "updateField",
      orgId: ctx.organizationId,
      meta: { id: input.id, field: input.field },
    });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await invalidateAndPublish({ topic: "clients", organizationId: ctx.organizationId, entityId: input.id });
  return { ok: true as const };
}

export async function remove(ctx: RequestContext, input: { id: string }) {
  const deleted = await deleteClientRecord(ctx.db, {
    organizationId: ctx.organizationId,
    id: input.id,
  });

  if (!deleted) {
    logger.warn("Client delete failed (not found)", {
      domain: "clients",
      operation: "delete",
      orgId: ctx.organizationId,
      meta: { id: input.id },
    });
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  await invalidateAndPublish({ topic: "clients", organizationId: ctx.organizationId, entityId: input.id });
  return { ok: true as const };
}