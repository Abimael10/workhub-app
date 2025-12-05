import { describe } from "vitest";

// Always run DB-backed suites; rely on runtime DATABASE_URL/TEST_DATABASE_URL.
export const describeIfTestDb = describe;
