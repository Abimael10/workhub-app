import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/utils/env";
import * as projectsSchema from "./schema/projects";
import * as clientsSchema from "./schema/clients";
import * as organizationsSchema from "./schema/organizations";
import * as filesSchema from "./schema/files";
import * as authSchema from "./schema/auth";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, {
  schema: {
    ...projectsSchema,
    ...clientsSchema,
    ...organizationsSchema,
    ...filesSchema,
    ...authSchema,
  },
});

export type Database = typeof db;
