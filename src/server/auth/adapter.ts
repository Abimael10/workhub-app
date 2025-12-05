import { and, eq } from "drizzle-orm";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import type { Database } from "@/server/db";
import {
  accounts,
  sessions,
  users,
  verificationTokens,
} from "@/server/db/schema/auth";

export function createAuthAdapter(db: Database): Adapter {
  return {
    async createUser(data: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
      const [user] = await db
        .insert(users)
        .values({
          ...data,
          email: data.email?.toLowerCase() ?? data.email,
        })
        .returning();

      return user;
    },

    async getUser(id: string) {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      if (!user) return null;

      // Map to the expected AdapterUser format with tenant fields
      return {
        ...user,
        organizationId: user.defaultOrganizationId || user.id, // Use user ID as fallback
        membershipId: "unknown", // Will be filled by session logic
      };
    },

    async getUserByEmail(email: string) {
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      if (!user) return null;

      // Map to the expected AdapterUser format with tenant fields
      return {
        ...user,
        organizationId: user.defaultOrganizationId || user.id,
        membershipId: "unknown",
      };
    },

    async getUserByAccount(account) {
      const [linkedAccount] = await db
        .select({
          user: users,
        })
        .from(accounts)
        .innerJoin(users, eq(users.id, accounts.userId))
        .where(
          and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)),
        );

      if (!linkedAccount?.user) return null;

      const user = linkedAccount.user;
      return {
        ...user,
        organizationId: user.defaultOrganizationId || user.id,
        membershipId: "unknown",
      };
    },

    async updateUser(data) {
      if (!data.id) {
        throw new Error("User id is required to update");
      }

      const [user] = await db.update(users).set(data).where(eq(users.id, data.id)).returning();
      if (!user) {
        throw new Error("User not found for update");
      }

      return {
        ...user,
        organizationId: user.defaultOrganizationId || user.id,
        membershipId: "unknown",
      };
    },

    async deleteUser(id) {
      await db.delete(users).where(eq(users.id, id));
      return;
    },

    async linkAccount(account: AdapterAccount) {
      const [linked] = await db.insert(accounts).values(account as AdapterAccount).returning();
      return linked;
    },

    async unlinkAccount(account: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      const [unlinked] = await db
        .delete(accounts)
        .where(
          and(eq(accounts.provider, account.provider), eq(accounts.providerAccountId, account.providerAccountId)),
        )
        .returning();
      return unlinked ?? null;
    },

    async createSession(session) {
      const [created] = await db.insert(sessions).values(session).returning();
      if (!created) {
        throw new Error("Session not created");
      }
      return created;
    },

    async getSessionAndUser(sessionToken) {
      const [result] = await db
        .select({
          session: sessions,
          user: users,
        })
        .from(sessions)
        .innerJoin(users, eq(users.id, sessions.userId))
        .where(eq(sessions.sessionToken, sessionToken));

      if (!result?.session || !result?.user) {
        return null;
      }

      return {
        session: result.session,
        user: {
          ...result.user,
          organizationId: result.user.defaultOrganizationId || result.user.id,
          membershipId: "unknown",
        }
      };
    },

    async updateSession(session) {
      const [updated] = await db
        .update(sessions)
        .set({
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        })
        .where(eq(sessions.sessionToken, session.sessionToken))
        .returning();
      return updated ?? null;
    },

    async deleteSession(sessionToken) {
      const [deleted] = await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken)).returning();
      return deleted ?? null;
    },

    async createVerificationToken(token) {
      const [created] = await db.insert(verificationTokens).values(token).returning();
      return created;
    },

    async useVerificationToken(params) {
      const [used] = await db
        .delete(verificationTokens)
        .where(and(eq(verificationTokens.identifier, params.identifier), eq(verificationTokens.token, params.token)))
        .returning();

      return used ?? null;
    },
  };
}
