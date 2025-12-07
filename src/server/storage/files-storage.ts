import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { env } from "@/lib/utils/env";
import { s3Client } from "./s3-client";

type UploadRequest = {
  filename: string;
  mimeType: string;
  size: number;
  organizationId: string;
};

class FilesStorage {
  private readonly maxUploadBytes = env.AWS_S3_MAX_UPLOAD * 1024 * 1024;

  constructor(private readonly client: S3Client, private readonly bucket: string) {
    if (!bucket) {
      throw new Error("[storage] AWS_S3_BUCKET_NAME must be provided");
    }
    if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
      console.warn(
        "[storage] AWS credentials missing – presigned URLs will fail in production environments.",
      );
    }
    if (process.env.NODE_ENV !== "production") {
      console.log("[storage] Initialized", {
        bucket: this.bucket,
        endpoint: env.AWS_ENDPOINT_URL ?? "aws",
      });
    }
  }

  private validateUploadRequest(params: UploadRequest) {
    if (!params.filename || params.filename.length > 255) {
      throw new Error("Nombre de archivo inválido");
    }
    if (params.size <= 0 || params.size > this.maxUploadBytes) {
      throw new Error(
        `El tamaño del archivo debe estar entre 1 byte y ${env.AWS_S3_MAX_UPLOAD} MB.`,
      );
    }
    if (!params.mimeType) {
      throw new Error("Se requiere mimeType");
    }
  }

  private async withRetry<T>(operation: () => Promise<T>, context: string) {
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        attempt += 1;
        const delayMs = 100 * 2 ** attempt;
        console.warn(`[storage] ${context} failed (attempt ${attempt})`, error);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError;
  }

  async getUploadUrl(params: UploadRequest) {
    this.validateUploadRequest(params);
    const key = `${params.organizationId}/${randomUUID()}-${params.filename}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: params.mimeType,
      ContentLength: params.size,
    });

    const url = await this.withRetry(
      () => getSignedUrl(this.client, command, { expiresIn: 60 * 5 }),
      "getUploadUrl",
    );

    return { uploadUrl: url, storageKey: key };
  }

  async getDownloadUrl(storageKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    return this.withRetry(
      () => getSignedUrl(this.client, command, { expiresIn: 60 * 5 }),
      "getDownloadUrl",
    );
  }

  async deleteObject(storageKey: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    await this.withRetry(() => this.client.send(command), "deleteObject");
  }

  async directUpload(params: { storageKey: string; body: Buffer; mimeType: string; size: number }) {
    if (params.size <= 0 || params.size > this.maxUploadBytes) {
      throw new Error(
        `El tamaño del archivo debe estar entre 1 byte y ${env.AWS_S3_MAX_UPLOAD} MB.`,
      );
    }

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.storageKey,
      Body: params.body,
      ContentType: params.mimeType,
      ContentLength: params.size,
    });

    await this.withRetry(() => this.client.send(command), "directUpload");
  }
}

export const filesStorage = new FilesStorage(s3Client, env.AWS_S3_BUCKET_NAME);

export type FilesStorageAdapter = typeof filesStorage;
