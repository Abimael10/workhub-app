import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, resetTestDb } from "../../helpers/test-db";
import { appRouter } from "@/server/trpc/router";
import { testOrgId } from "../../helpers/test-org";

describe("Files tRPC Router Integration Tests", () => {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for service tests");
  }

  const { db } = createTestDb(connectionString);
  const createCaller = appRouter.createCaller;

  beforeEach(async () => {
    await resetTestDb(db);
  });


  it("should register a new file", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    const fileData = {
      name: "test-file.pdf",
      description: "A test file",
      mimeType: "application/pdf",
      size: 1024,
      storageKey: "test-storage-key",
    };

    const file = await caller.files.registerFile(fileData);

    expect(file).toBeDefined();
    expect(file.name).toBe("test-file.pdf");
    expect(file.description).toBe("A test file");
    expect(file.mimeType).toBe("application/pdf");
    expect(file.size).toBe(1024);
    expect(file.storageKey).toBe("test-storage-key");
    expect(file.organizationId).toBe(testOrgId);
  });

  it("should list files", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a file first
    await caller.files.registerFile({
      name: "test-file.pdf",
      description: "A test file",
      mimeType: "application/pdf",
      size: 1024,
      storageKey: `${testOrgId}/test-storage-key`,
    });

    const files = await caller.files.list();

    expect(files).toBeDefined();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].name).toBe("test-file.pdf");
  });

  it("should delete a file", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a file first
    const file = await caller.files.registerFile({
      name: "test-file.pdf",
      description: "A test file",
      mimeType: "application/pdf",
      size: 1024,
      storageKey: `${testOrgId}/test-storage-key`,  // Storage key must start with organization ID
    });

    // Verify file exists
    const filesBefore = await caller.files.list();
    expect(filesBefore.length).toBe(1);

    // Delete the file
    const result = await caller.files.delete({
      id: file.id,
      storageKey: `${testOrgId}/test-storage-key`,  // Storage key must start with organization ID
    });

    expect(result.success).toBe(true);

    // Verify file is deleted
    const filesAfter = await caller.files.list();
    expect(filesAfter.length).toBe(0);
  });
});