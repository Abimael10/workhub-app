import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { db } from "@/server/db";
import { getMembershipByUserAndOrganization, listMembershipsForUser } from "@/server/db/repositories/memberships-repo";
import { getUserById } from "@/server/db/repositories/users-repo";
import { filesStorage } from "@/server/storage/files-storage";

export async function createContext() {
  const session = await getCurrentUser();
  const userId = session?.user?.id ?? null;
  const dbUser = userId ? await getUserById(db, userId) : null;
  const preferredOrgId = dbUser?.defaultOrganizationId ?? session?.user?.organizationId ?? null;

  let membership =
    userId && preferredOrgId
      ? await getMembershipByUserAndOrganization(db, { userId, organizationId: preferredOrgId })
      : null;

  if (!membership && userId) {
    const memberships = await listMembershipsForUser(db, userId);
    membership = memberships.at(0) ?? null;
  }

  return {
    db,
    session,
    organizationId: membership ? membership.organizationId : null,
    membershipId: membership?.id ?? null,
    userId,
    storage: filesStorage,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
