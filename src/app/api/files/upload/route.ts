import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { createStorageRequestContext } from "@/server/application/context";
import * as filesService from "@/server/application/files/service";
import { getUserById } from "@/server/db/repositories/users-repo";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";
import { env } from "@/lib/utils/env";

const MAX_UPLOAD_BYTES = env.AWS_S3_MAX_UPLOAD * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const uploadBuckets = new Map<string, { count: number; windowStart: number }>();
const ALLOWED_MIME_PATTERNS = [
  // Images
  /^image\//,
  // Documents
  /^application\/pdf$/,
  /^application\/vnd\.openxmlformats-officedocument\.(wordprocessingml|spreadsheetml|presentationml)\./, // .docx, .xlsx, .pptx
  /^application\/vnd\.ms-(powerpoint|excel|word)$/, // .ppt, .xls, .doc
  /^application\/msword$/,
  // Text files
  /^text\//,
  // Code files
  /^application\/json$/,
  /^application\/x-ipynb\+json$/, // Jupyter notebooks
  /^application\/x-python-code$/,
  // Archives
  /^application\/(zip|x-zip-compressed)$/,
  /^application\/x-(tar|gzip|7z-compressed|rar-compressed)$/,
  /^application\/vnd\.rar$/,
  // Data files
  /^application\/octet-stream$/,
  // Presentations
  /^application\/vnd\.oasis\.opendocument\.(presentation|spreadsheet|text)$/, // .odp, .ods, .odt
  // Audio/Video (if needed)
  /^audio\//,
  /^video\//,
  // Spreadsheets
  /^application\/vnd\.google-(sheets|apps\.spreadsheet)$/,
  // Additional common types
  /^application\/(x-|)msdownload$/,
  /^application\/javascript$/,
  /^application\/x-latex$/,
  /^application\/x-tex$/,
];

function isMimeAllowed(mime: string) {
  return ALLOWED_MIME_PATTERNS.some((pattern) => pattern.test(mime));
}

export async function POST(request: Request) {
  const session = await getCurrentUser();
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 });
  }

  if (isRateLimited(userId, request)) {
    return NextResponse.json({ message: "Demasiadas cargas. Intenta de nuevo en un momento." }, { status: 429 });
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

  const formData = await request.formData();
  const file = formData.get("file");
  const description = formData.get("description");

  if (!(file instanceof File)) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "Se requiere un archivo" }, { status: 400 });
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "Se requiere una descripción" }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "Archivo demasiado grande. Límite 25MB." }, { status: 413 });
  }

  const mimeType = file.type || "application/octet-stream";
  const size = file.size;
  const filename = file.name || "upload.bin";

  if (!isMimeAllowed(mimeType)) {
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "Tipo de archivo no permitido" }, { status: 415 });
  }

  try {
    const ctx = await createStorageRequestContext({ id: userId, organizationId });
    const storageKey = `${organizationId}/${randomUUID()}-${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await ctx.storage.directUpload({
      storageKey,
      body: buffer,
      mimeType,
      size,
    });

    const record = await filesService.registerUpload(ctx, {
      name: filename,
      description,
      mimeType,
      size,
      storageKey,
    });

    releaseRateLimit(userId, request);
    return NextResponse.json({ storageKey, record });
  } catch (error) {
    console.error("[files] upload route failed", error);
    releaseRateLimit(userId, request);
    return NextResponse.json({ message: "No se pudo subir el archivo" }, { status: 500 });
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
  const entry = uploadBuckets.get(key);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    uploadBuckets.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  uploadBuckets.set(key, entry);
  return entry.count > RATE_LIMIT_MAX;
}

function releaseRateLimit(userId: string, request: Request) {
  const key = rateLimitKey(userId, request);
  const entry = uploadBuckets.get(key);
  if (!entry) return;
  entry.count = Math.max(0, entry.count - 1);
  uploadBuckets.set(key, entry);
}
