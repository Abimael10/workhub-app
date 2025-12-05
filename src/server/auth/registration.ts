import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "./passwords";
import { createOrganization } from "@/server/db/repositories/organizations-repo";
import { createMembership } from "@/server/db/repositories/memberships-repo";
import { createUser, getUserByEmail, setDefaultOrganization } from "@/server/db/repositories/users-repo";

const registrationSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.email("Correo inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  organizationName: z.string().min(1, "El nombre de la organización es requerido"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export async function registerUser(input: RegistrationInput) {
  const parsed = registrationSchema.parse(input);
  const normalizedEmail = parsed.email.toLowerCase();

  return db.transaction(async (tx) => {
    const existing = await getUserByEmail(tx as any, normalizedEmail);
    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }

    const organization = await createOrganization(tx as any, { name: parsed.organizationName });
    if (!organization) {
      throw new Error("Failed to create organization");
    }
    const passwordHash = hashPassword(parsed.password);

    const user = await createUser(tx as any, {
      email: normalizedEmail,
      name: parsed.name,
      passwordHash,
      defaultOrganizationId: organization.id,
    });
    if (!user) {
      throw new Error("Failed to create user");
    }

    const membership = await createMembership(tx as any, {
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    });

    await setDefaultOrganization(tx as any, { userId: user.id, organizationId: organization.id });

    return { user, membership, organization };
  });
}
