import type { FileDraft, FileObject } from "./types";

export function registerFile(draft: FileDraft): Omit<FileObject, "id" | "createdAt" | "updatedAt"> {
  return {
    ...draft,
    description: draft.description ?? "",
    mimeType: draft.mimeType ?? "application/octet-stream",
  };
}

export function canDeleteFile(file: FileObject, actorOrganizationId: string) {
  return file.organizationId === actorOrganizationId;
}
