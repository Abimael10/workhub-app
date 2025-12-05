import { S3Client } from "@aws-sdk/client-s3";
import { env } from "@/lib/utils/env";

const baseConfigWithoutEndpoint = {
  region: env.AWS_S3_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
  },
};

const baseConfigWithEndpoint = {
  ...baseConfigWithoutEndpoint,
  endpoint: env.AWS_S3_ENDPOINT!,
  forcePathStyle: true,
};

export const s3Client = new S3Client(
  env.AWS_S3_ENDPOINT ? baseConfigWithEndpoint : baseConfigWithoutEndpoint
);
