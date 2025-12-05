export type FileObject = {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description?: string | null;
  mimeType?: string | null;
  size: number;
  storageKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export type FileDraft = Pick<FileObject, "organizationId" | "name" | "description" | "mimeType" | "size" | "storageKey" | "createdBy">;
