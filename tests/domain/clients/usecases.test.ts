import { describe, it, expect } from "vitest";
import { updateClientField, calculateEngagementDays } from "@/domain/clients/usecases";
import type { Client } from "@/domain/clients/types";

describe("Clients Domain - Use Cases", () => {
  describe("updateClientField", () => {
    const mockClient: Client = {
      id: "test-id",
      organizationId: "org-test",
      createdBy: "user-test",
      name: "Test Client",
      type: "COMPANY",
      valueDop: 1000,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    };

    it("should update the client name field", () => {
      const updatedClient = updateClientField(mockClient, "name", "New Client Name");
      expect(updatedClient.name).toBe("New Client Name");
      expect(updatedClient.updatedAt).not.toEqual(mockClient.updatedAt);
    });

    it("should update the client type field with valid values", () => {
      const updatedClient = updateClientField(mockClient, "type", "PERSON");
      expect(updatedClient.type).toBe("PERSON");
      expect(updatedClient.updatedAt).not.toEqual(mockClient.updatedAt);
    });

    it("should throw an error when updating type with invalid value", () => {
      expect(() => {
        updateClientField(mockClient, "type", "INVALID_TYPE");
      }).toThrow("Tipo de cliente no válido");
    });

    it("should update the valueDop field with number conversion", () => {
      const updatedClient = updateClientField(mockClient, "valueDop", "2500");
      expect(updatedClient.valueDop).toBe(2500);
      expect(updatedClient.updatedAt).not.toEqual(mockClient.updatedAt);
    });

    it("should update date fields", () => {
      const updatedClient = updateClientField(mockClient, "startDate", "2024-01-01");
      expect(updatedClient.startDate).toBe("2024-01-01");
      expect(updatedClient.updatedAt).not.toEqual(mockClient.updatedAt);
    });

    it("should handle null values", () => {
      const updatedClient = updateClientField(mockClient, "endDate", null);
      expect(updatedClient.endDate).toBeNull();
      expect(updatedClient.updatedAt).not.toEqual(mockClient.updatedAt);
    });

    it("should handle empty string values", () => {
      const updatedClient = updateClientField(mockClient, "endDate", "");
      expect(updatedClient.endDate).toBeNull();
    });
  });

  describe("calculateEngagementDays", () => {
    it("should return null when start date is missing", () => {
      const client: Client = {
        id: "test-id",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Test Client",
        type: "COMPANY",
        valueDop: 1000,
        startDate: null,
        endDate: "2023-12-31",
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };
      expect(calculateEngagementDays(client)).toBeNull();
    });

    it("should return null when end date is missing", () => {
      const client: Client = {
        id: "test-id",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Test Client",
        type: "COMPANY",
        valueDop: 1000,
        startDate: "2023-01-01",
        endDate: null,
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };
      expect(calculateEngagementDays(client)).toBeNull();
    });

    it("should calculate engagement days correctly", () => {
      const client: Client = {
        id: "test-id",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Test Client",
        type: "COMPANY",
        valueDop: 1000,
        startDate: "2023-01-01",
        endDate: "2023-01-10", // 9 days difference
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };
      expect(calculateEngagementDays(client)).toBe(9);
    });

    it("should return 0 when end date is before start date", () => {
      const client: Client = {
        id: "test-id",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Test Client",
        type: "COMPANY",
        valueDop: 1000,
        startDate: "2023-12-31",
        endDate: "2023-01-01", // End date before start date
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };
      expect(calculateEngagementDays(client)).toBe(0);
    });

    it("should return 0 when start and end dates are the same", () => {
      const client: Client = {
        id: "test-id",
        organizationId: "org-test",
        createdBy: "user-test",
        name: "Test Client",
        type: "COMPANY",
        valueDop: 1000,
        startDate: "2023-01-01",
        endDate: "2023-01-01", // Same date
        createdAt: new Date("2023-01-01"),
        updatedAt: new Date("2023-01-01"),
      };
      expect(calculateEngagementDays(client)).toBe(0);
    });
  });
});