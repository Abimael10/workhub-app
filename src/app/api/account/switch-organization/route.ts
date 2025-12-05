import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";
import { setDefaultOrganization } from "@/server/db/repositories/users-repo";

const payloadSchema = z.object({
  organizationId: z.string().uuid(),
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
    return NextResponse.json({ message: "Organización inválida" }, { status: 400 });
  }

  const session = await getCurrentUser();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const membership = await getMembershipByUserAndOrganization(db, {
    userId,
    organizationId: parsed.data.organizationId,
  });

  if (!membership) {
    return NextResponse.json({ message: "No tienes acceso a esta organización" }, { status: 403 });
  }

  await setDefaultOrganization(db, { userId, organizationId: parsed.data.organizationId });

  return NextResponse.json({ success: true, organizationId: parsed.data.organizationId });
}
