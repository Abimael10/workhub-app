import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().default("workhub-local"),
  AWS_S3_ENDPOINT: z.string().optional(),
  DEFAULT_ORGANIZATION_ID: z.uuid().optional(),
  DEMO_USER_EMAIL: z.email().optional(),
  DEMO_USER_PASSWORD: z.string().min(8).optional(),
  DEMO_USER_NAME: z.string().optional(),
  AWS_S3_MAX_UPLOAD_MB: z.coerce.number().min(1).max(200).default(25),
  REDIS_URL: z.string().url().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_REGION: process.env.AWS_S3_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT,
  DEFAULT_ORGANIZATION_ID: process.env.DEFAULT_ORGANIZATION_ID,
  DEMO_USER_EMAIL: process.env.DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD: process.env.DEMO_USER_PASSWORD,
  DEMO_USER_NAME: process.env.DEMO_USER_NAME,
  AWS_S3_MAX_UPLOAD_MB: process.env.AWS_S3_MAX_UPLOAD_MB,
  REDIS_URL: process.env.REDIS_URL,
});
