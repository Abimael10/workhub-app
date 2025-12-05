import { inArray } from "drizzle-orm";
import type { Database } from "@/server/db";
import { clients } from "@/server/db/schema/clients";
import { files } from "@/server/db/schema/files";
import { memberships } from "@/server/db/schema/auth";
import { organizations } from "@/server/db/schema/organizations";
import { projects } from "@/server/db/schema/projects";

export async function purgeOrganization(db: Database, organizationIds: string[]) {
  if (organizationIds.length === 0) return;

  await db.delete(files).where(inArray(files.organizationId, organizationIds));
  await db.delete(projects).where(inArray(projects.organizationId, organizationIds));
  await db.delete(clients).where(inArray(clients.organizationId, organizationIds));
  await db.delete(memberships).where(inArray(memberships.organizationId, organizationIds));
  await db.delete(organizations).where(inArray(organizations.id, organizationIds));
}
