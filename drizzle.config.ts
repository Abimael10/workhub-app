import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set – Drizzle commands may fail.");
}

export default defineConfig({
  schema: "./src/server/db/schema/*.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  migrations: {
    prefix: "timestamp",
  },
  strict: true,
  verbose: true,
});
