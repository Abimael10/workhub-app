import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { createStorageRequestContext } from "@/server/application/context";
import { getUserById } from "@/server/db/repositories/users-repo";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";

const payloadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

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

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "JSON inválido" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
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

  const mimeType = parsed.data.mimeType || "application/octet-stream";
  if (!isMimeAllowed(mimeType)) {
    return NextResponse.json({ message: "Tipo de archivo no permitido" }, { status: 415 });
  }

  try {
    const ctx = await createStorageRequestContext({ id: userId, organizationId });
    const { uploadUrl, storageKey } = await ctx.storage.getUploadUrl({
      filename: parsed.data.filename,
      mimeType,
      size: parsed.data.size,
      organizationId,
    });

    return NextResponse.json({ uploadUrl, storageKey });
  } catch (error) {
    console.error("[files] presign failed", error);
    return NextResponse.json({ message: "No se pudo generar la URL de carga" }, { status: 500 });
  }
}
