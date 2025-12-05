import { eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { organizations, type Organization } from "@/server/db/schema/organizations";

export async function getOrganization(db: Database, id: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  return org;
}

export async function ensureOrganization(db: Database, name: string): Promise<Organization | null> {
  const [existing] = await db.select().from(organizations).where(eq(organizations.name, name));
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(organizations)
    .values({ name })
    .returning();
  return created || null;
}

export async function ensureOrganizationById(db: Database, params: { id: string; name: string }) {
  const [existing] = await db.select().from(organizations).where(eq(organizations.id, params.id));
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(organizations)
    .values({ id: params.id, name: params.name })
    .onConflictDoNothing({ target: organizations.id })
    .returning();

  if (created) {
    return created;
  }

  const [fresh] = await db.select().from(organizations).where(eq(organizations.id, params.id));
  return fresh;
}

export async function createOrganization(db: Database, params: { name: string; id?: string }): Promise<Organization | null> {
  const [organization] = await db
    .insert(organizations)
    .values({
      id: params.id,
      name: params.name,
    })
    .returning();

  return organization || null;
}
