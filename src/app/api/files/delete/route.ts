import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { createStorageRequestContext } from "@/server/application/context";
import * as filesService from "@/server/application/files/service";
import { getUserById } from "@/server/db/repositories/users-repo";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";

const payloadSchema = z.object({
  id: z.uuid(),
  storageKey: z.string().min(1),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const deleteBuckets = new Map<string, { count: number; windowStart: number }>();

export async function POST(request: Request) {
  const session = await getCurrentUser();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (isRateLimited(userId, request)) {
    return NextResponse.json({ message: "Demasiadas solicitudes. Intenta de nuevo más tarde." }, { status: 429 });
  }

  const dbUser = await getUserById(db, userId);
  const organizationId = dbUser?.defaultOrganizationId ?? session?.user?.organizationId ?? null;

  if (!organizationId) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  const membership = await getMembershipByUserAndOrganization(db, { userId, organizationId });
  if (!membership) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    releaseRateLimit(userId, request);
    return NextResponse.json(parsed.error.format(), { status: 400 });
  }

  if (!parsed.data.storageKey.startsWith(`${organizationId}/`) || parsed.data.storageKey.includes("..")) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "StorageKey inválido" }, { status: 400 });
  }

  try {
    const ctx = await createStorageRequestContext({ id: userId, organizationId });
    const result = await filesService.deleteFile(ctx, {
      id: parsed.data.id,
      storageKey: parsed.data.storageKey,
    });
    if (!result.ok) {
      releaseRateLimit(userId, request);
      return NextResponse.json({ message: "Archivo no encontrado" }, { status: 404 });
    }
    releaseRateLimit(userId, request);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[files] delete route failed", error);
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "No se pudo eliminar el archivo" }, { status: 500 });
  }
}

function rateLimitKey(userId: string, request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${userId}:${ip}`;
}

function isRateLimited(userId: string, request: Request) {
  const key = rateLimitKey(userId, request);
  const now = Date.now();
  const entry = deleteBuckets.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    deleteBuckets.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  deleteBuckets.set(key, entry);
  return entry.count > RATE_LIMIT_MAX;
}

function releaseRateLimit(userId: string, request: Request) {
  const key = rateLimitKey(userId, request);
  const entry = deleteBuckets.get(key);
  if (!entry) return;
  entry.count = Math.max(0, entry.count - 1);
  deleteBuckets.set(key, entry);
}
