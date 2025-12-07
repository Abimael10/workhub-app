import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { env } from "@/lib/utils/env";
import { createAuthAdapter } from "@/server/auth/adapter";
import { verifyPassword } from "@/server/auth/passwords";
import { db } from "@/server/db";
import { getPrimaryMembership } from "@/server/db/repositories/memberships-repo";
import { getUserByEmail } from "@/server/db/repositories/users-repo";
import { getOrganization } from "@/server/db/repositories/organizations-repo";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;
const loginAttempts = new Map<
  string,
  { count: number; firstAttempt: number; lockedUntil?: number }
>();

function isRateLimited(identifier: string) {
  const record = loginAttempts.get(identifier);
  if (!record) return false;
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    return true;
  }
  if (now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(identifier);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const record = loginAttempts.get(identifier);
  if (!record || now - record.firstAttempt > WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return;
  }
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + WINDOW_MS;
  }
}

function clearAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}

export const authOptions: NextAuthOptions = {
  secret: env.NEXT_AUTH_SECRET,
  adapter: createAuthAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Workspace login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase() ?? "";
        const password = credentials?.password ?? "";
        const identifier = email || "anonymous";

        if (isRateLimited(identifier)) {
          console.warn("[auth] Too many login attempts for", identifier);
          throw new Error("Too many login attempts. Please try again later.");
        }

        const user = email ? await getUserByEmail(db, email) : null;
        if (!user) {
          recordFailedAttempt(identifier);
          return null;
        }

        const membership = await getPrimaryMembership(db, {
          userId: user.id,
          preferredOrganizationId: user.defaultOrganizationId,
        });

        if (!membership) {
          recordFailedAttempt(identifier);
          console.warn("[auth] User has no organization membership", { email, userId: user.id });
          return null;
        }

        const passwordValid = verifyPassword(password, user.passwordHash);

        if (!passwordValid) {
          recordFailedAttempt(identifier);
          return null;
        }

        clearAttempts(identifier);

        const organization = await getOrganization(db, membership.organizationId);

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          organizationId: membership.organizationId,
          membershipId: membership.id,
          membershipRole: membership.role,
          organizationName: organization?.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const enrichedUser = user as {
          organizationId?: string | null;
          membershipId?: string | null;
          organizationName?: string | null;
          membershipRole?: string | null;
        };
        token.organizationId = enrichedUser.organizationId ?? token.organizationId;
        token.membershipId = enrichedUser.membershipId ?? token.membershipId;
        token.organizationName = enrichedUser.organizationName ?? token.organizationName;
        token.membershipRole = enrichedUser.membershipRole ?? token.membershipRole;
        const userId = (user as { id?: string })?.id;
        if (userId) {
          token.sub = userId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.organizationId = token.organizationId as string;
        session.user.membershipId = token.membershipId as string;
        session.user.id = token.sub as string;
        session.user.organizationName = (token as { organizationName?: string | null }).organizationName ?? null;
        session.user.membershipRole = (token as { membershipRole?: string | null }).membershipRole ?? null;
      }
      return session;
    },
  },
};
