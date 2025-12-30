import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { deleteAccountAndData } from "@/server/auth/delete-account";
import { logger } from "@/lib/logging";

const payloadSchema = z.object({
  confirm: z.literal("DELETE"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  try {
    payloadSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn("Invalid delete account request", { domain: "account", operation: "delete" }, error);
      return NextResponse.json(
        { message: "Confirma la eliminación escribiendo DELETE", issues: /*--- this shows as deprecated: error.flatten() ----*/ z.treeifyError(error) },
        { status: 400 },
      );
    }
    logger.warn("Invalid delete account request format", { domain: "account", operation: "delete" }, error);
    return NextResponse.json({ message: "Solicitud inválida" }, { status: 400 });
  }

  const session = await getCurrentUser();
  const userId = session?.user?.id;

  if (!userId) {
    logger.warn("Unauthorized delete account attempt", { domain: "account", operation: "delete", orgId: session?.user.organizationId || "" });
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  try {
    logger.info("Starting account deletion process", { domain: "account", operation: "delete", orgId: session.user.organizationId });
    await deleteAccountAndData(userId);
    logger.info("Account deletion completed successfully", { domain: "account", operation: "delete", orgId: session.user.organizationId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Account deletion failed", { domain: "account", operation: "delete", orgId: session.user.organizationId }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: "No se pudo eliminar la cuenta" }, { status: 500 });
  }
}
