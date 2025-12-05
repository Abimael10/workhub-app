import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, resetTestDb } from "../../helpers/test-db";
import { appRouter } from "@/server/trpc/router";
import { testOrgId } from "../../helpers/test-org";

describe("Projects tRPC Router Integration Tests", () => {
  const connectionString = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set for service tests");
  }

  const { db } = createTestDb(connectionString);
  const createCaller = appRouter.createCaller;

  beforeEach(async () => {
    await resetTestDb(db);
  });


  it("should create a new project", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    const projectData = {
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG" as const,
      priority: "HIGH" as const,
    };

    const project = await caller.projects.create(projectData);

    expect(project).toBeDefined();
    expect(project.name).toBe("Test Project");
    expect(project.description).toBe("A test project");
    expect(project.status).toBe("BACKLOG");
    expect(project.priority).toBe("HIGH");
    expect(project.organizationId).toBe(testOrgId);
  });

  it("should list projects", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a project first
    await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG",
      priority: "HIGH",
    });

    const projects = await caller.projects.list();

    expect(projects).toBeDefined();
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
    expect(projects[0].name).toBe("Test Project");
  });

  it("should update project status", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a project first
    const project = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG",
      priority: "HIGH",
    });

    // Change status from BACKLOG to IN_PROGRESS (valid transition)
    const updatedProject = await caller.projects.changeStatus({
      id: project.id,
      status: "IN_PROGRESS",
    });

    expect(updatedProject).toBeDefined();
    expect(updatedProject.status).toBe("IN_PROGRESS");
  });

  it("should not allow invalid status transition", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a project first
    const project = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG",
      priority: "HIGH",
    });

    // Try to change status from BACKLOG to DONE (invalid transition)
    await expect(
      caller.projects.changeStatus({
        id: project.id,
        status: "DONE",
      })
    ).rejects.toThrow();
  });

  it("should update project details", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a project first
    const project = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG",
      priority: "HIGH",
    });

    const updatedProject = await caller.projects.update({
      id: project.id,
      name: "Updated Project Name",
      description: "Updated description",
      priority: "CRITICAL",
    });

    expect(updatedProject).toBeDefined();
    expect(updatedProject.name).toBe("Updated Project Name");
    expect(updatedProject.description).toBe("Updated description");
    expect(updatedProject.priority).toBe("CRITICAL");
  });

  it("should delete a project", async () => {
    const caller = createCaller({
      session: { user: { id: "00000000-0000-0000-0000-000000000000", organizationId: testOrgId, membershipId: "11111111-1111-1111-1111-111111111111" } },
      db,
      organizationId: testOrgId,
      userId: "00000000-0000-0000-0000-000000000000",
      membershipId: "11111111-1111-1111-1111-111111111111",
    });

    // Create a project first
    const project = await caller.projects.create({
      name: "Test Project",
      description: "A test project",
      status: "BACKLOG",
      priority: "HIGH",
    });

    // Verify project exists
    const projectsBefore = await caller.projects.list();
    expect(projectsBefore.length).toBe(1);

    // Delete the project
    const result = await caller.projects.delete({
      id: project.id,
    });

    expect(result.success).toBe(true);

    // Verify project is deleted
    const projectsAfter = await caller.projects.list();
    expect(projectsAfter.length).toBe(0);
  });
});