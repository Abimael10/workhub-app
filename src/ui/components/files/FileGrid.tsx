"use client";

import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, type RouterOutputs } from "@/lib/trpc/client";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/ui/components/common/Badge";
import { Button } from "@/ui/components/common/Button";
import { Spinner } from "@/ui/components/common/Spinner";
import { ConfirmDialog } from "@/ui/components/common/ConfirmDialog";
import { deleteFileAction } from "@/server/actions/files/delete-file";

type FileRecord = RouterOutputs["files"]["list"][number];

type FileGridProps = {
  initialFiles?: FileRecord[];
};

export function FileGrid({ initialFiles }: FileGridProps) {
  const utils = api.useUtils();
  const {
    data,
    isLoading,
    error,
  } = api.files.list.useQuery(undefined, {
    refetchOnMount: true,
    staleTime: 0, // Always treat data as stale to ensure fresh fetch on mount
    ...(initialFiles && { initialData: initialFiles }),
  });
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [files, setFiles] = useState<FileRecord[]>(initialFiles ?? []);
  const [confirmFile, setConfirmFile] = useState<FileRecord | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setFiles(data);
    }
  }, [data]);



  const handleDownload = async (file: FileRecord) => {
    setDownloadingId(file.id);
    try {
      window.open(`/api/files/download?storageKey=${encodeURIComponent(file.storageKey)}`, "_blank");
    } catch (error) {
      console.error("Download failed", error);
      toast.error("No se pudo descargar el archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (file: FileRecord) => {
    const previous = files;
    setFiles((current) => current.filter((entry) => entry.id !== file.id));

    try {
      // Use the server action for consistency with other delete operations
      const response = await deleteFileAction(file.id, file.storageKey);

      if (!response.success) {
        // Handle the detailed error response
        const errorMessage = response.details
          ? `${response.error}: ${response.details}`
          : response.error || "No se pudo eliminar el archivo";
        throw new Error(errorMessage);
      }

      // Invalidate the files list query
      await utils.files.list.invalidate();

      toast.success(`${file.name} eliminado`);
    } catch (error) {
      console.error("Delete failed", error);
      setFiles(previous);
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el archivo");
    } finally {
      setConfirmFile(null);
    }
  };

  if (error) {
    throw error;
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/5">
        <Spinner />
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-muted-foreground">
        Sube archivos para verlos listados aquí.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {files.map((file) => {
          const isSelected = false;
          return (
            <article
              key={file.id}
              className={`glass-panel golden-border flex min-h-[220px] flex-col gap-3 p-5 text-sm text-white transition hover:-translate-y-0.5 ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="w-full overflow-hidden text-lg font-semibold leading-tight break-all line-clamp-2">
                    {file.name}
                  </h3>
                  <p className="w-full overflow-hidden text-xs text-muted-foreground break-all line-clamp-1">
                    {file.mimeType}
                  </p>
                </div>
                <Badge tone="default" className="shrink-0">{formatFileSize(file.size)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3 break-words">
                {file.description ?? "Sin descripción"}
              </p>
              <div className="text-xs text-muted-foreground">
                Guardado <span suppressHydrationWarning>{formatDate(file.createdAt)}</span> · Por {file.creator?.name ?? file.creator?.email ?? "—"}
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(file)}
                  disabled={downloadingId === file.id}
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmFile(file)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(confirmFile)}
        onOpenChange={(open) => {
          if (!open) setConfirmFile(null);
        }}
        title="Eliminar archivo"
        description={
          confirmFile
            ? `¿Eliminar "${confirmFile.name}"? Esta acción no se puede deshacer.`
            : "¿Eliminar este archivo?"
        }
        confirmLabel="Eliminar"
        confirmTone="destructive"
        isConfirming={false}
        onConfirm={async () => {
          if (confirmFile) {
            await handleDelete(confirmFile);
          }
        }}
      />
    </>
  );
}

function formatFileSize(size?: number | null) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = size;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
