export type FilesStoragePort = {
  getUploadUrl(params: { filename: string; mimeType: string; size: number; organizationId: string }): Promise<{
    uploadUrl: string;
    storageKey: string;
  }>;
  getDownloadUrl(storageKey: string): Promise<string>;
  deleteObject(storageKey: string): Promise<void>;
  directUpload(params: { storageKey: string; body: Buffer; mimeType: string; size: number }): Promise<void>;
};
