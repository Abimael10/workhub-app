import { describe, it, expect } from "vitest";
import { createProjectAggregate, changeProjectStatus, sortProjects } from "@/domain/projects/usecases";
import { assertTransition, canTransition } from "@/domain/projects/status-machine";
import type { ProjectDraft, Project } from "@/domain/projects/types";

describe("Projects Domain - Use Cases", () => {
  describe("createProjectAggregate", () => {
    const mockProjectDraft: ProjectDraft = {
      organizationId: "org-test",
      createdBy: "user-test",
      name: "Test Project",
      description: "Test project description",
      priority: "HIGH",
      status: "BACKLOG",
    };

    it("should create a project with all provided properties", () => {
      const result = createProjectAggregate(mockProjectDraft);
      
      expect(result.organizationId).toBe("org-test");
      expect(result.createdBy).toBe("user-test");
      expect(result.name).toBe("Test Project");
      expect(result.description).toBe("Test project description");
      expect(result.status).toBe("BACKLOG");
      expect(result.priority).toBe("HIGH");
    });

    it("should set default description when not provided", () => {
      const draftWithoutDescription: ProjectDraft = {
        ...mockProjectDraft,
        description: undefined,
      };
      
      const result = createProjectAggregate(draftWithoutDescription);
      expect(result.description).toBe("");
    });

    it("should set default status when not provided", () => {
      const draftWithoutStatus: ProjectDraft = {
        ...mockProjectDraft,
        status: undefined,
      };
      
      const result = createProjectAggregate(draftWithoutStatus);
      expect(result.status).toBe("BACKLOG");
    });

    it("should set default priority when not provided", () => {
      const draftWithoutPriority: ProjectDraft = {
        ...mockProjectDraft,
        priority: undefined,
      };
      
      const result = createProjectAggregate(draftWithoutPriority);
      expect(result.priority).toBe("MEDIUM");
    });

    it("should handle null description by setting default", () => {
      const draftWithNullDescription: ProjectDraft = {
        ...mockProjectDraft,
        description: null,
      };
      
      const result = createProjectAggregate(draftWithNullDescription);
      expect(result.description).toBe("");
    });
  });

  describe("changeProjectStatus", () => {
    const mockProject: Project = {
      id: "project-test",
      organizationId: "org-test",
      createdBy: "user-test",
      name: "Test Project",
      description: "Test project description",
      status: "BACKLOG",
      priority: "HIGH",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    };

    it("should change project status and update timestamp", () => {
      const updatedProject = changeProjectStatus(mockProject, "IN_PROGRESS");
      expect(updatedProject.status).toBe("IN_PROGRESS");
      expect(updatedProject.updatedAt).not.toEqual(mockProject.updatedAt);
    });

    it("should throw error for invalid status transition", () => {
      // Trying to move from BACKLOG directly to DONE (invalid transition)
      expect(() => {
        changeProjectStatus(mockProject, "DONE");
      }).toThrow("No se puede mover el proyecto de BACKLOG a DONE");
    });

    it("should allow valid status transition", () => {
      const updatedProject = changeProjectStatus(mockProject, "IN_PROGRESS");
      expect(updatedProject.status).toBe("IN_PROGRESS");
    });
  });

  describe("sortProjects", () => {
    const mockProjects: Project[] = [
      {
        id: "1",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Project 1",
        description: "Description 1",
        status: "IN_PROGRESS",
        priority: "LOW",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
      {
        id: "2",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Project 2",
        description: "Description 2",
        status: "BACKLOG",
        priority: "HIGH",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
      {
        id: "3",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Project 3",
        description: "Description 3",
        status: "DONE",
        priority: "CRITICAL",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
      {
        id: "4",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Project 4",
        description: "Description 4",
        status: "IN_PROGRESS",
        priority: "HIGH",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      },
    ];

    it("should sort projects by status and priority", () => {
      const sorted = sortProjects(mockProjects);
      
      // Projects should be ordered by status first, then by priority within same status
      expect(sorted[0].status).toBe("BACKLOG");
      expect(sorted[1].status).toBe("IN_PROGRESS");
      expect(sorted[1].priority).toBe("HIGH"); // Higher priority first within same status
      expect(sorted[2].priority).toBe("LOW");
      expect(sorted[3].status).toBe("DONE");
    });

    it("should handle empty array", () => {
      const sorted = sortProjects([]);
      expect(sorted).toEqual([]);
    });

    it("should handle single project", () => {
      const singleProject = [mockProjects[0]];
      const sorted = sortProjects(singleProject);
      expect(sorted).toEqual(singleProject);
    });
  });
});

describe("Projects Status Machine", () => {
  describe("canTransition", () => {
    it("should return true for valid transitions", () => {
      expect(canTransition("BACKLOG", "IN_PROGRESS")).toBe(true);
      expect(canTransition("IN_PROGRESS", "BACKLOG")).toBe(true);
      expect(canTransition("IN_PROGRESS", "BLOCKED")).toBe(true);
      expect(canTransition("IN_PROGRESS", "DONE")).toBe(true);
      expect(canTransition("BLOCKED", "IN_PROGRESS")).toBe(true);
    });

    it("should return false for invalid transitions", () => {
      expect(canTransition("BACKLOG", "DONE")).toBe(false);
      expect(canTransition("BACKLOG", "BLOCKED")).toBe(false);
      expect(canTransition("DONE", "IN_PROGRESS")).toBe(false);
      expect(canTransition("DONE", "BACKLOG")).toBe(false);
      expect(canTransition("DONE", "BLOCKED")).toBe(false);
    });

    it("should return true for same status transition", () => {
      expect(canTransition("BACKLOG", "BACKLOG")).toBe(true);
      expect(canTransition("IN_PROGRESS", "IN_PROGRESS")).toBe(true);
      expect(canTransition("BLOCKED", "BLOCKED")).toBe(true);
      expect(canTransition("DONE", "DONE")).toBe(true);
    });
  });

  describe("assertTransition", () => {
    it("should not throw for valid transitions", () => {
      expect(() => assertTransition("BACKLOG", "IN_PROGRESS")).not.toThrow();
      expect(() => assertTransition("IN_PROGRESS", "DONE")).not.toThrow();
    });

    it("should throw for invalid transitions", () => {
      expect(() => assertTransition("BACKLOG", "DONE")).toThrow("No se puede mover el proyecto de BACKLOG a DONE");
      expect(() => assertTransition("DONE", "IN_PROGRESS")).toThrow("No se puede mover el proyecto de DONE a IN_PROGRESS");
    });
  });
});