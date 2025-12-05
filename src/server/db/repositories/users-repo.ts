import { eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { users, type UserModel } from "@/server/db/schema/auth";

type CreateUserParams = {
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  defaultOrganizationId?: string | null;
  image?: string | null;
};

export async function getUserByEmail(db: Database, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function getUserById(db: Database, id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function createUser(db: Database, params: CreateUserParams): Promise<UserModel | null> {
  const [user] = await db
    .insert(users)
    .values({
      email: params.email,
      name: params.name ?? null,
      passwordHash: params.passwordHash ?? null,
      defaultOrganizationId: params.defaultOrganizationId ?? null,
      image: params.image ?? null,
    })
    .returning();

  return user || null;
}

export async function setDefaultOrganization(
  db: Database,
  params: { userId: string; organizationId: string },
) {
  const [user] = await db
    .update(users)
    .set({ defaultOrganizationId: params.organizationId })
    .where(eq(users.id, params.userId))
    .returning();

  return user;
}
