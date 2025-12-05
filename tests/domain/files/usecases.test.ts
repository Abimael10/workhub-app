import { describe, it, expect } from "vitest";
import { registerFile, canDeleteFile } from "@/domain/files/usecases";
import type { FileDraft, FileObject } from "@/domain/files/types";

describe("Files Domain - Use Cases", () => {
  describe("registerFile", () => {
    const mockFileDraft: FileDraft = {
      organizationId: "org-test",
      createdBy: "user-test",
      name: "test-file.pdf",
      description: "Test file description",
      mimeType: "application/pdf",
      size: 1024,
      storageKey: "test-storage-key",
    };

    it("should register a file with all provided properties", () => {
      const result = registerFile(mockFileDraft);
      
      expect(result.organizationId).toBe("org-test");
      expect(result.createdBy).toBe("user-test");
      expect(result.name).toBe("test-file.pdf");
      expect(result.description).toBe("Test file description");
      expect(result.mimeType).toBe("application/pdf");
      expect(result.size).toBe(1024);
      expect(result.storageKey).toBe("test-storage-key");
    });

    it("should set default description when not provided", () => {
      const draftWithoutDescription: FileDraft = {
        ...mockFileDraft,
        description: undefined,
      };
      
      const result = registerFile(draftWithoutDescription);
      expect(result.description).toBe("");
    });

    it("should set default mimeType when not provided", () => {
      const draftWithoutMimeType: FileDraft = {
        ...mockFileDraft,
        mimeType: undefined,
      };
      
      const result = registerFile(draftWithoutMimeType);
      expect(result.mimeType).toBe("application/octet-stream");
    });

    it("should handle null description by setting default", () => {
      const draftWithNullDescription: FileDraft = {
        ...mockFileDraft,
        description: null,
      };
      
      const result = registerFile(draftWithNullDescription);
      expect(result.description).toBe("");
    });
  });

  describe("canDeleteFile", () => {
    const mockFile: FileObject = {
      id: "file-test",
      organizationId: "org-test",
      createdBy: "user-test",
      name: "test-file.pdf",
      description: "Test file description",
      mimeType: "application/pdf",
      size: 1024,
      storageKey: "test-storage-key",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should return true when file organization matches actor organization", () => {
      const result = canDeleteFile(mockFile, "org-test");
      expect(result).toBe(true);
    });

    it("should return false when file organization does not match actor organization", () => {
      const result = canDeleteFile(mockFile, "different-org");
      expect(result).toBe(false);
    });

    it("should return false when actor has empty organization ID", () => {
      const result = canDeleteFile(mockFile, "");
      expect(result).toBe(false);
    });
  });
});