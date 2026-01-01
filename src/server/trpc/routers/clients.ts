import { TRPCError } from "@trpc/server";
import { createClientSchema, listClientsSchema, updateClientFieldSchema } from "@/lib/validation/clients";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { CLIENTS_PAGE_SIZE } from "@/domain/clients/constants";
import * as clientsService from "@/server/application/clients/service";
import { getRequestId } from "@/lib/logging/requestId";

/**
 * Clients router - handles all client-related operations
 * All procedures require authentication and organization membership
 */
export const clientsRouter = createTRPCRouter({
  /**
   * List clients with pagination and optional search
   * @param input Optional pagination and search parameters
   * @returns Paginated list of clients
   */
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
  /**
   * Create a new client
   * @param input Client data including name, type, value, and dates
   * @returns Created client
   */
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
  /**
   * Update a client field
   * @param input Client ID and field to update
   * @returns Success confirmation
   */
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
  /**
   * Delete a client
   * @param input Client ID
   * @returns Success confirmation
   */
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