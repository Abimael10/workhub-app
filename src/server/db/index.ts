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
  max: 10, // Reduced from 20 to decrease memory footprint
  min: 2,  // Reduced from 5 to decrease memory footprint
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 5000, // Reduced from 7500 to promote connection rotation
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
