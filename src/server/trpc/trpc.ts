import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import { trpcTransformer } from "@/lib/trpc/transformer";
import { getRequestId } from "@/lib/logging/requestId";

const t = initTRPC.context<Context>().create({
  transformer: trpcTransformer,
  /**
   * @see https://trpc.io/docs/v11/error-formatting
   */
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        requestId: getRequestId(),
        zodError: error.cause instanceof Error ? error.cause.message : null,
      },
    };
  },
});

const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user || !ctx.organizationId || !ctx.membershipId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.session.user,
      membershipId: ctx.membershipId,
    },
  });
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUser);
