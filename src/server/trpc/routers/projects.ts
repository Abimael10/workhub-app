import { TRPCError } from "@trpc/server";
import { changeProjectStatusSchema, createProjectSchema } from "@/lib/validation/projects";
import { protectedProcedure, createTRPCRouter } from "../trpc";
import * as projectsService from "@/server/application/projects/service";
import { getRequestId } from "@/lib/logging/requestId";

export const projectsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const orgCtx = { ...ctx, organizationId: ctx.organizationId!, userId: ctx.userId! };
    return projectsService.list(orgCtx);
  }),
  create: protectedProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
    const orgCtx = { ...ctx, organizationId: ctx.organizationId!, userId: ctx.userId! };
    const projectData = {
      name: input.name,
      ...(input.description != null && { description: input.description }),
      status: input.status,
      priority: input.priority,
    };

    const project = await projectsService.create(orgCtx, projectData);
    return project;
  }),
  changeStatus: protectedProcedure
    .input(changeProjectStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const orgCtx = { ...ctx, organizationId: ctx.organizationId!, userId: ctx.userId! };
      const requestId = getRequestId();
      const result = await projectsService.changeStatus(orgCtx, input);

      if (!result.ok) {
        if (result.error === "NOT_FOUND") {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found", cause: { requestId } });
        }
        throw new TRPCError({ code: "BAD_REQUEST", message: result.error, cause: { requestId } });
      }

      return result.project;
    }),
  update: protectedProcedure
    .input(
      createProjectSchema
        .pick({ name: true, description: true, priority: true })
        .extend({ id: changeProjectStatusSchema.shape.id }),
    )
    .mutation(async ({ ctx, input }) => {
      const orgCtx = { ...ctx, organizationId: ctx.organizationId!, userId: ctx.userId! };

      // Prepare update data, only including defined values
      const updateData = {
        id: input.id,
        name: input.name,
        priority: input.priority,
        ...(input.description != null && { description: input.description }),
      };

      const updated = await projectsService.update(orgCtx, updateData);

      if (!updated.ok || !updated.project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return updated.project;
    }),
  delete: protectedProcedure
    .input(changeProjectStatusSchema.pick({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const orgCtx = { ...ctx, organizationId: ctx.organizationId!, userId: ctx.userId! };
      const deleted = await projectsService.remove(orgCtx, { id: input.id });

      if (!deleted.ok) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { success: true };
    }),
});
