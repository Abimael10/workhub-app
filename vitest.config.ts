import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    passWithNoTests: true,
    pool: "threads",
    maxConcurrency: 1, // Avoid DB conflicts by running specs serially
    sequence: {
      concurrent: false,
    },
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/tests": path.resolve(__dirname, "tests"),
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
      pino: path.resolve(__dirname, "tests/mocks/pino.ts"),
    },
  },
});
