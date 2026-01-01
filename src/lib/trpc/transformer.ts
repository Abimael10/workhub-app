import superjson from "superjson";

/**
 * Shared transformer instance so client/server stay in sync
 * SuperJSON handles serialization of complex data types like Dates, Maps, Sets, etc.
 * @see https://trpc.io/docs/v11/data-transformers
 */
export const trpcTransformer = superjson;
