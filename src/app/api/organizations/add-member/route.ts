import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { db } from "@/server/db";
import { getMembershipByUserAndOrganization, createMembership } from "@/server/db/repositories/memberships-repo";
import { getUserByEmail } from "@/server/db/repositories/users-repo";
import { getUserById } from "@/server/db/repositories/users-repo";

const payloadSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const session = await getCurrentUser();
  const user = session?.user;
  if (!user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const dbUser = await getUserById(db, user.id);
  const activeOrgId = dbUser?.defaultOrganizationId ?? user.organizationId;
  if (!activeOrgId) {
    return NextResponse.json({ message: "Organización no encontrada" }, { status: 400 });
  }

  const membership = await getMembershipByUserAndOrganization(db, {
    userId: user.id,
    organizationId: activeOrgId,
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ message: "Solo propietarios pueden invitar" }, { status: 403 });
  }

  const targetUser = await getUserByEmail(db, parsed.data.email.toLowerCase());
  if (!targetUser) {
    return NextResponse.json({ message: "No existe un usuario con ese correo" }, { status: 404 });
  }

  const created = await createMembership(db, {
    userId: targetUser.id,
    organizationId: activeOrgId,
    role: parsed.data.role,
  });

  return NextResponse.json({
    success: true,
    membershipId: created?.id,
    userId: targetUser.id,
  });
}
