import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { createStorageRequestContext } from "@/server/application/context";
import * as filesService from "@/server/application/files/service";
import { getUserById } from "@/server/db/repositories/users-repo";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";

export async function GET(request: Request) {
  const session = await getCurrentUser();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const dbUser = await getUserById(db, userId);
  const organizationId = dbUser?.defaultOrganizationId ?? session?.user?.organizationId ?? null;

  if (!organizationId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const membership = await getMembershipByUserAndOrganization(db, { userId, organizationId });

  if (!membership) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storageKey = searchParams.get("storageKey");

  if (!storageKey) {
    return NextResponse.json({ message: "Se requiere storageKey" }, { status: 400 });
  }

  if (!storageKey.startsWith(`${organizationId}/`) || storageKey.includes("..")) {
    return NextResponse.json({ message: "StorageKey inválido" }, { status: 400 });
  }

  try {
    const ctx = await createStorageRequestContext({ id: userId, organizationId });
    const result = await filesService.getDownloadUrl(ctx, storageKey);
    if (!result.ok || !result.url) {
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });
    }

    const fileResponse = await fetch(result.url);
    if (!fileResponse.ok || !fileResponse.body) {
      throw new Error("Empty object body");
    }

    const stream = fileResponse.body;
    return new Response(stream, {
      headers: {
        "Content-Type": fileResponse.headers.get("Content-Type") ?? "application/octet-stream",
        "Content-Length": fileResponse.headers.get("Content-Length") ?? "0",
        "Content-Disposition": `attachment; filename="${storageKey.split("/").pop() ?? "download"}"`,
      },
    });
  } catch (error) {
    console.error("[files] download proxy failed", error);
    return NextResponse.json({ message: "No se pudo descargar el archivo" }, { status: 500 });
  }
}
