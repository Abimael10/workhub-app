"use client";

import { useCallback, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

type PendingFile = {
  file: File;
  description: string;
};

export function UploadDropzone() {
  const utils = api.useUtils();
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const onDrop = useCallback((files: File[]) => {
    if (!files.length) return;
    setPendingFiles((current) => [
      ...current,
      ...files.map((file) => ({ file, description: file.name.replace(/\.[^.]+$/, "") })),
    ]);
  }, []);

  const handleDescriptionChange = (index: number, value: string) => {
    setPendingFiles((current) => {
      const next = [...current];
      if (next[index]) {
        next[index] = {
          file: next[index].file,
          description: value,
        };
      }
      return next;
    });
  };

  const handleUpload = async () => {
    if (!pendingFiles.length) {
      toast.error("Agrega al menos un archivo antes de subir.");
      return;
    }
    setIsUploading(true);
    try {
      for (const pending of pendingFiles) {
        if (!pending?.file) {
          console.warn("[files] skipping pending entry without file", pending);
          continue;
        }
        const { file, description } = pending;
        const uploadResponse = await fetch("/api/files/upload", {
          method: "POST",
          body: (() => {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("description", description);
            return fd;
          })(),
        });

        if (!uploadResponse.ok) {
          throw new Error(await uploadResponse.text());
        }

        const { record } = await uploadResponse.json();

        utils.files.list.setData(undefined, (old) => {
          if (Array.isArray(old)) {
            return [record, ...old];
          }
          return [record];
        });
        toast.success(`${file.name} subido`);
      }
      await utils.files.list.invalidate();
      setPendingFiles([]);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Error al subir. Revisa las credenciales de S3.");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 5,
    multiple: true,
    noClick: true,
  });

  const disableUpload = useMemo(
    () => pendingFiles.some((pending) => pending.description.trim().length === 0),
    [pendingFiles],
  );

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "glass-panel golden-border flex flex-col items-center justify-center gap-3 border-dashed p-8 text-center text-muted-foreground transition",
          isDragActive && "border-primary bg-primary/5 text-white shadow-glow",
          (isUploading || pendingFiles.length > 0) && "opacity-80",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-10 w-10 text-primary" />
        <p className="text-lg font-semibold text-white">Arrastra los archivos aquí</p>
        <p className="text-sm text-muted-foreground">
          Pediremos metadatos antes de guardarlos en S3 + Postgres.
        </p>
        <button
          type="button"
          onClick={open}
          className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          O haz clic para buscarlos
        </button>
      </div>

      {pendingFiles.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-black/40 p-4 text-sm text-white">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Cargas pendientes</p>
          <div className="mt-4 space-y-4">
            {pendingFiles.map((pending, index) => (
              <div key={`${pending.file.name}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{pending.file.name}</p>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
                    }
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Descripción"
                  value={pending.description}
                  onChange={(event) => handleDescriptionChange(index, event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-white"
              onClick={() => setPendingFiles([])}
              disabled={isUploading}
            >
              Limpiar todo
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={disableUpload || isUploading}
              className={cn(
                "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-amber-500/30 transition hover:shadow-glow",
                (disableUpload || isUploading) && "cursor-not-allowed opacity-50",
              )}
            >
              {isUploading ? "Subiendo…" : "Subir archivos"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
