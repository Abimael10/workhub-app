import { TRPCError } from "@trpc/server";
import { createClientSchema, listClientsSchema, updateClientFieldSchema } from "@/lib/validation/clients";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import * as clientsService from "@/server/application/clients/service";
import { getRequestId } from "@/lib/logging/requestId";

export const clientsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(listClientsSchema.partial().optional())
    .query(async ({ ctx, input }) => {
      const params = {
        page: input?.page ?? 1,
        pageSize: input?.pageSize ?? CLIENTS_PAGE_SIZE,
        ...(input?.search !== undefined && { search: input.search }),
      };

      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      return clientsService.listPage(orgCtx, params);
    }),
  create: protectedProcedure
    .input(createClientSchema)
    .mutation(async ({ ctx, input }) => {
      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      const client = await clientsService.create(orgCtx, {
        name: input.name,
        type: input.type,
        valueDop: input.valueDop ? Number(input.valueDop) : 0,
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      });
      return client;
    }),
  updateField: protectedProcedure
    .input(updateClientFieldSchema)
    .mutation(async ({ ctx, input }) => {
      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      const requestId = getRequestId();
      const updated = await clientsService.updateField(orgCtx, input);

      if (!updated.ok) {
        throw new TRPCError({ code: "NOT_FOUND", cause: { requestId } });
      }

      return { success: true };
    }),
  delete: protectedProcedure
    .input(updateClientFieldSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      const requestId = getRequestId();
      const deleted = await clientsService.remove(orgCtx, { id: input.id });

      if (!deleted.ok) {
        throw new TRPCError({ code: "NOT_FOUND", cause: { requestId } });
      }

      return { success: true };
    }),
});