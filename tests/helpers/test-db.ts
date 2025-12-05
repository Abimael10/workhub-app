import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as projectsSchema from "@/server/db/schema/projects";
import * as clientsSchema from "@/server/db/schema/clients";
import * as organizationsSchema from "@/server/db/schema/organizations";
import * as filesSchema from "@/server/db/schema/files";
import * as authSchema from "@/server/db/schema/auth";
import { testOrgId } from "./test-org";  // Import the correct constant

export function createTestDb(connectionString: string) {
  const pool = new Pool({
    connectionString,
    ssl: false,
    // Limit connections to prevent issues
    max: 1,
  });

  const db = drizzle(pool, {
    schema: {
      ...projectsSchema,
      ...clientsSchema,
      ...organizationsSchema,
      ...filesSchema,
      ...authSchema,
    },
  });

  return { db, pool };
}


/**
 * Properly reset the test database respecting foreign key constraints
 */
// Simple mutex to ensure only one test can reset the DB at a time
let dbResetMutex: Promise<void> = Promise.resolve();

/**
 * Asynchronous lock implementation to ensure sequential DB resets
 */
async function withDbLock<T>(operation: () => Promise<T>): Promise<T> {
  const previousLock = dbResetMutex;
  let releaseLock!: (value: void | Promise<void>) => void;
  dbResetMutex = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });

  // Wait for the previous operation to complete
  await previousLock;

  try {
    return await operation();
  } finally {
    // Release this operation's lock
    releaseLock();
  }
}

/**
 * Properly reset the test database respecting foreign key constraints
 */
export async function resetTestDb(db: ReturnType<typeof createTestDb>["db"]) {
  return withDbLock(async () => {
    await db.transaction(async (tx) => {
      // Delete in the correct order - children first, then parents
      await tx.execute(
        sql`DELETE FROM ${filesSchema.files}`
      );
      await tx.execute(
        sql`DELETE FROM ${projectsSchema.projects}`
      );
      await tx.execute(
        sql`DELETE FROM ${clientsSchema.clients}`
      );
      await tx.execute(
        sql`DELETE FROM ${authSchema.memberships}`
      );
      await tx.execute(
        sql`DELETE FROM ${authSchema.users}`
      );
      await tx.execute(
        sql`DELETE FROM ${organizationsSchema.organizations}`
      );

      // Now reinsert base data in dependency order (parents first, then children)
      await tx
        .insert(organizationsSchema.organizations)
        .values({
          id: testOrgId,  // Use imported value
          name: "Test Org"
        });
      await tx
        .insert(authSchema.users)
        .values({
          id: "00000000-0000-0000-0000-000000000000",
          email: "test@example.com",
          name: "Test User",
          image: null,
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      await tx
        .insert(authSchema.memberships)
        .values({
          id: "11111111-1111-1111-1111-111111111111",
          userId: "00000000-0000-0000-0000-000000000000",
          organizationId: testOrgId,  // Use imported value
          role: "ADMIN",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
    });
  });
}

