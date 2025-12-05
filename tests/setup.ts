import fs from "fs";
import path from "path";
import { vi } from "vitest";

// Minimal env loader (avoids adding dotenv dependency)
const envFiles = [".env.local", ".env"];
for (const file of envFiles) {
  const full = path.resolve(__dirname, "..", file);
  if (!fs.existsSync(full)) continue;
  const contents = fs.readFileSync(full, "utf8");
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key) continue;
    const value = rest.join("=");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

// Avoid hitting Redis in unit/integration tests.
delete process.env.REDIS_URL;

// Mock Next.js cache utilities used in services to avoid touching Next internals during unit tests.
vi.mock("next/cache", () => ({
  revalidateTag: () => Promise.resolve(),
  unstable_cache: (fn: unknown) => fn,
}));

// Prevent accidental redirects in tests.
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Error("redirect called");
  },
}));

// Stub Auth.js session for route handlers when not set.
vi.mock("next-auth", () => ({
  getServerSession: () =>
    Promise.resolve({ user: { id: "user-test", organizationId: "org-test", membershipId: "membership-test" } }),
}));

