import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, resetTestDb } from "../../helpers/test-db";
import { appRouter } from "@/server/trpc/router";
import { testOrgId } from "../../helpers/test-org";

describe("Clients tRPC Router Integration Tests", () => {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for service tests");
  }

  const { db } = createTestDb(connectionString);
  const createCaller = appRouter.createCaller;

  beforeEach(async () => {
    await resetTestDb(db);
  });


  it("should create a new client", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    const clientData = {
      name: "Test Client",
      type: "COMPANY" as const,
      valueDop: "5000",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    };

    const client = await caller.clients.create(clientData);

    expect(client).toBeDefined();
    expect(client.name).toBe("Test Client");
    expect(client.type).toBe("COMPANY");
    expect(client.valueDop).toBe("5000.00");
    expect(client.organizationId).toBe(testOrgId);
  });

  it("should list clients", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a client first
    await caller.clients.create({
      name: "Test Client",
      type: "COMPANY",
      valueDop: "5000",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    });

    const clients = await caller.clients.list();

    expect(clients).toBeDefined();
    expect(Array.isArray(clients.items)).toBe(true);
    expect(clients.items.length).toBeGreaterThan(0);
    expect(clients.items[0].name).toBe("Test Client");
  });

  it("should update client field", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a client first
    const client = await caller.clients.create({
      name: "Test Client",
      type: "COMPANY",
      valueDop: "5000",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    });

    // Update the client name
    const result = await caller.clients.updateField({
      id: client.id,
      field: "name",
      value: "Updated Client Name",
    });

    expect(result.success).toBe(true);

    // Verify the update by listing clients
    const updatedClients = await caller.clients.list();
    const updatedClient = updatedClients.items.find(c => c.id === client.id);
    expect(updatedClient?.name).toBe("Updated Client Name");
  });

  it("should delete a client", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a client first
    const client = await caller.clients.create({
      name: "Test Client",
      type: "COMPANY",
      valueDop: "5000",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    });

    // Verify client exists
    const clientsBefore = await caller.clients.list();
    expect(clientsBefore.items.length).toBe(1);

    // Delete the client
    const result = await caller.clients.delete({
      id: client.id,
    });

    expect(result.success).toBe(true);

    // Verify client is deleted
    const clientsAfter = await caller.clients.list();
    expect(clientsAfter.items.length).toBe(0);
  });

  it("should not allow invalid client type update", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a client first
    const client = await caller.clients.create({
      name: "Test Client",
      type: "COMPANY",
      valueDop: "5000",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
    });

    // Try to update with invalid type
    await expect(
      caller.clients.updateField({
        id: client.id,
        field: "type",
        value: "INVALID_TYPE",
      })
    ).rejects.toThrow();
  });
});