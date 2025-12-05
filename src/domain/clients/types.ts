export const clientTypes = ["PERSON", "COMPANY"] as const;
export type ClientType = (typeof clientTypes)[number];

export type Client = {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  type: ClientType;
  valueDop: number;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
};
