import type { Client, ClientType } from "./types";

type EditableField = "name" | "type" | "valueDop" | "startDate" | "endDate";

export function updateClientField(client: Client, field: EditableField, value: string | number | null): Client {
  if (field === "type" && value && !["PERSON", "COMPANY"].includes(String(value))) {
    throw new Error("Tipo de cliente no válido");
  }

  // Handle empty string values by converting them to null for date fields
  const nextValue =
    field === "valueDop"
      ? Number(value || 0)
      : typeof value === "string"
        ? (value === "" ? null : value) // Convert empty strings to null
        : value ?? null;

  return {
    ...client,
    [field]: field === "type" ? (nextValue as ClientType) : nextValue,
    updatedAt: new Date(),
  };
}

export function calculateEngagementDays(client: Client) {
  if (!client.startDate || !client.endDate) return null;
  const start = new Date(client.startDate);
  const end = new Date(client.endDate);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}
