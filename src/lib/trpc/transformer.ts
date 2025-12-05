import superjson from "superjson";

// Shared transformer instance so client/server stay in sync (SuperJSON handles Dates/Maps).
export const trpcTransformer = superjson;
