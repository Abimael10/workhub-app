import type { Metadata } from "next";
import { requireUser } from "@/server/auth/requireUser";
import { getFilesSnapshot } from "@/server/queries/dashboard";
import { FileGrid } from "@/ui/components/files/FileGrid";
import { UploadFileModal } from "@/ui/components/files/UploadFileModal";
import { createDashboardMetadata } from "@/lib/metadata";

export const runtime = "nodejs";

export const metadata: Metadata = createDashboardMetadata({
  title: "Archivos",
  description: "Almacenamiento sobre S3 con cargas prefirmadas, enlaces de descarga y metadatos.",
  path: "/files",
});

export default async function FilesPage() {
  const user = await requireUser();
  const files = await getFilesSnapshot(user.organizationId);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Bóveda segura</p>
          <h1 className="mt-2 font-display text-3xl text-white">Archivos</h1>
          <p className="text-sm text-muted-foreground">
            Carga directo a S3 con URLs pre-firmadas.
          </p>
        </div>
        <UploadFileModal />
      </div>
      <FileGrid initialFiles={files} />
    </section>
  );
}
