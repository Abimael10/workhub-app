import type { Database } from "@/server/db";
import type { FilesStoragePort } from "./files/storage-port";

export type RequestContext = {
  db: Database;
  organizationId: string;
  userId: string;
  membershipId: string;
};

export type StorageRequestContext = RequestContext & {
  storage: FilesStoragePort;
};
