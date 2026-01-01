import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/trpc/router";
import { createContext } from "@/server/trpc/context";
import { getRequestId } from "@/lib/logging/requestId";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    /**
     * @see https://trpc.io/docs/v11/error-handling
     */
    onError({ error, path, input, ctx /*req*/ }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`tRPC Error at ${path}:`, error);
      }
      console.error("tRPC Error:", {
        path,
        input: JSON.stringify(input, null, 2),
        context: ctx ? "Available" : "Not available",
        requestId: getRequestId(),
        error: error.message,
      });
    },
  });

export { handler as GET, handler as POST };
