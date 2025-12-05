import { and, asc, eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { memberships, type MembershipModel } from "@/server/db/schema/auth";

type CreateMembershipParams = {
  userId: string;
  organizationId: string;
  role?: MembershipModel["role"];
};

export async function createMembership(db: Database, params: CreateMembershipParams) {
  const [membership] = await db
    .insert(memberships)
    .values({
      userId: params.userId,
      organizationId: params.organizationId,
      role: params.role ?? "OWNER",
    })
    .onConflictDoNothing({
      target: [memberships.userId, memberships.organizationId],
    })
    .returning();

  return membership ?? (await getMembershipByUserAndOrganization(db, params));
}

export async function getMembershipByUserAndOrganization(
  db: Database,
  params: { userId: string; organizationId: string },
) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, params.userId), eq(memberships.organizationId, params.organizationId)));

  return membership;
}

export async function listMembershipsForUser(db: Database, userId: string) {
  return db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .orderBy(asc(memberships.createdAt));
}

export async function listMembershipsWithOrganization(db: Database, userId: string) {
  return db.query.memberships.findMany({
    where: (fields, { eq }) => eq(fields.userId, userId),
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    with: {
      organization: true,
    },
  });
}

export async function listMembersByOrganization(db: Database, organizationId: string) {
  return db.query.memberships.findMany({
    where: (fields, { eq }) => eq(fields.organizationId, organizationId),
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
    with: {
      user: {
        columns: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getPrimaryMembership(
  db: Database,
  params: { userId: string; preferredOrganizationId?: string | null },
) {
  if (params.preferredOrganizationId) {
    const preferred = await getMembershipByUserAndOrganization(db, {
      userId: params.userId,
      organizationId: params.preferredOrganizationId,
    });
    if (preferred) {
      return preferred;
    }
  }

  const membershipsForUser = await listMembershipsForUser(db, params.userId);
  return membershipsForUser.at(0) ?? null;
}
