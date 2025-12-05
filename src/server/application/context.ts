import { db } from "@/server/db";
import { filesStorage } from "@/server/storage/files-storage";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import type { RequestContext, StorageRequestContext } from "./types";

type UserLike = { id?: string | null; organizationId?: string | null };

export async function createRequestContext(user: UserLike): Promise<RequestContext> {
  if (!user.id || !user.organizationId) {
    throw new Error("User session is incomplete (id or organizationId missing)");
  }

  const membership = await getMembershipByUserAndOrganization(db, {
    userId: user.id,
    organizationId: user.organizationId,
  });

  if (!membership) {
    throw new Error("User is not authorized for this organization");
  }

  return {
    db,
    organizationId: membership.organizationId,
    userId: membership.userId,
    membershipId: membership.id,
  };
}

export async function createStorageRequestContext(user: UserLike): Promise<StorageRequestContext> {
  const ctx = await createRequestContext(user);
  return { ...ctx, storage: filesStorage };
}
