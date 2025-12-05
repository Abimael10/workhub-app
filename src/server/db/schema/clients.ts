import { relations } from "drizzle-orm";
import {
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const clientTypeEnum = pgEnum("client_type", ["PERSON", "COMPANY"]);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: text("name").notNull(),
    type: clientTypeEnum("type").default("PERSON").notNull(),
    valueDop: numeric("value_dop", { precision: 14, scale: 2 }).default("0"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    organizationClientUnique: uniqueIndex("clients_org_name_unique").on(
      table.organizationId,
      table.name,
    ),
    // Additional performance indexes
    clientsOrgIdx: index("clients_organization_id_idx").on(table.organizationId),
    clientsCreatedAtIdx: index("clients_created_at_idx").on(table.createdAt),
    clientsUpdatedAtIdx: index("clients_updated_at_idx").on(table.updatedAt),
  }),
);

export const clientsRelations = relations(clients, ({ one }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
}));

export type ClientModel = typeof clients.$inferSelect;
