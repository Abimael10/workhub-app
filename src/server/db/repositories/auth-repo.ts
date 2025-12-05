import { eq, inArray } from "drizzle-orm";
import type { Database } from "@/server/db";
import { accounts, sessions, users } from "@/server/db/schema/auth";

export async function deleteSessionsByUser(db: Database, userId: string) {
  return db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function deleteAccountsByUser(db: Database, userId: string) {
  return db.delete(accounts).where(eq(accounts.userId, userId));
}

export async function deleteUsers(db: Database, userIds: string[]) {
  if (userIds.length === 0) return;
  await db.delete(users).where(inArray(users.id, userIds));
}
