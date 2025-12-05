import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { registerFileSchema } from "@/lib/validation/files";
import * as filesService from "@/server/application/files/service";

export const filesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = {
      ...ctx,
      organizationId: ctx.organizationId!,
      userId: ctx.userId!, // Ensure userId is not null
    };
    return filesService.list(orgCtx);
  }),
  registerFile: protectedProcedure.input(registerFileSchema).mutation(async ({ ctx, input }) => {
    try {
      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      const record = await filesService.registerUpload(orgCtx, {
        ...input,
      });
      return record;
    } catch (error) {
      console.error("[files] register mutation failed", error);
      throw error;
    }
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid(), storageKey: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const orgCtx = {
        ...ctx,
        organizationId: ctx.organizationId!,
        userId: ctx.userId!, // Ensure userId is not null
      };
      if (!input.storageKey.startsWith(`${orgCtx.organizationId}/`)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid storage key" });
      }
      const deleted = await filesService.deleteFile(orgCtx, { id: input.id, storageKey: input.storageKey });
      if (!deleted.ok) {
        throw new TRPCError({ code: "NOT_FOUND", message: "File not found" });
      }
      return { success: true };
    }),
});