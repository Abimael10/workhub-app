import { redirect } from "next/navigation";
import { getCurrentUser } from "./getCurrentUser";
import { db } from "@/server/db";
import { ensureOrganizationById, getOrganization } from "@/server/db/repositories/organizations-repo";
import { listMembershipsForUser } from "@/server/db/repositories/memberships-repo";
import { getUserById } from "@/server/db/repositories/users-repo";

export async function requireUser() {
  const session = await getCurrentUser();
  const user = session?.user;

  if (!user?.id || !user.organizationId) {
    redirect("/login");
  }

  const dbUser = await getUserById(db, user.id);
  const targetOrgId = dbUser?.defaultOrganizationId ?? user.organizationId;

  const membershipsForUser = await listMembershipsForUser(db, user.id);
  const membership =
    membershipsForUser.find((m) => m.organizationId === targetOrgId) ??
    membershipsForUser.at(0) ??
    null;

  if (!membership) {
    redirect("/login");
  }

  const existingOrg = await getOrganization(db, membership.organizationId);
  const organization =
    existingOrg ??
    (await ensureOrganizationById(db, {
      id: membership.organizationId,
      name: `${membership.organizationId.slice(0, 8)} Workspace`,
    }));

  return {
    ...user,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    organizationName: organization?.name ?? null,
    membershipRole: membership.role ?? user.membershipRole ?? null,
  };
}
