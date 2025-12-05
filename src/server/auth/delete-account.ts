import { and, count, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { deleteAccountsByUser, deleteSessionsByUser, deleteUsers } from "@/server/db/repositories/auth-repo";
import { listMembershipsForUser } from "@/server/db/repositories/memberships-repo";
import { purgeOrganization } from "@/server/db/repositories/purge-org-repo";
import { clients } from "@/server/db/schema/clients";
import { files } from "@/server/db/schema/files";
import { projects } from "@/server/db/schema/projects";
import { memberships as membershipsTable, users } from "@/server/db/schema/auth";

import { logger } from "@/lib/logging";

export async function deleteAccountAndData(userId: string) {
  return db.transaction(async (tx) => {
    try {
      logger.info("Starting account deletion", { domain: "account", operation: "delete", orgId: "" });

      // CASCADE: First, delete all projects, clients, and files created by this user
      // This handles foreign key constraints from the created_by field
      await tx.delete(projects).where(eq(projects.createdBy, userId));
      logger.info("Projects created by user deleted", { domain: "account", operation: "delete", orgId: "" });

      await tx.delete(clients).where(eq(clients.createdBy, userId));
      logger.info("Clients created by user deleted", { domain: "account", operation: "delete", orgId: "" });

      await tx.delete(files).where(eq(files.createdBy, userId));
      logger.info("Files created by user deleted", { domain: "account", operation: "delete", orgId: "" });

      // Get user memberships to determine which organizations might need to be purged
      const userMemberships = await listMembershipsForUser(tx as any, userId);
      const ownerOrgIds = userMemberships.filter((m) => m.role === "OWNER").map((m) => m.organizationId);
      const purgeOrgIds: string[] = [];

      // Determine which organizations should be purged (if user is the only owner)
      for (const orgId of ownerOrgIds) {
        const [ownerCountResult] = await tx
          .select({ value: count() })
          .from(membershipsTable)
          .where(and(eq(membershipsTable.organizationId, orgId), eq(membershipsTable.role, "OWNER")));

        const ownerCount = ownerCountResult?.value ?? 0;

        if (ownerCount <= 1) {
          purgeOrgIds.push(orgId);
        }
      }
      logger.info("Organizations to purge", { domain: "account", operation: "delete", orgId: "" });

      // Delete user-specific data
      await deleteSessionsByUser(tx as any, userId);
      logger.info("Sessions deleted", { domain: "account", operation: "delete", orgId: "" });

      await deleteAccountsByUser(tx as any, userId);
      logger.info("Accounts deleted", { domain: "account", operation: "delete", orgId: "" });

      // Remove the default organization reference before purging organizations to avoid foreign key issues
      await tx
        .update(users)
        .set({ defaultOrganizationId: null })
        .where(eq(users.id, userId));
      logger.info("Default organization reference cleared", { domain: "account", operation: "delete", orgId: "" });

      // If user owns organizations with no other owners, purge those organizations
      // This also deletes memberships related to those organizations, and it still would make sense
      if (purgeOrgIds.length > 0) {
        logger.info("Purging organizations", { domain: "account", operation: "delete", orgId: "" });
        await purgeOrganization(tx as any, purgeOrgIds);
        logger.info("Organizations purged successfully", { domain: "account", operation: "delete", orgId: "" });
      }

      // Remove user's remaining memberships to organizations (for organizations where they weren't the only owner)
      await tx.delete(membershipsTable).where(eq(membershipsTable.userId, userId));
      logger.info("Memberships deleted", { domain: "account", operation: "delete", orgId: "" });

      // Finally, delete the user account
      await deleteUsers(tx as any, [userId]);
      logger.info("User deleted", { domain: "account", operation: "delete", orgId: "" });
    } catch (error) {
      logger.error("Error during account deletion", { domain: "account", operation: "delete", orgId: "" }, error instanceof Error ? error : new Error(String(error)));
      throw error; // Re-throw to maintain transaction rollback
    }
  });
}
