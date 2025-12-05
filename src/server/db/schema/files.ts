import { relations } from "drizzle-orm";
import {
  bigint,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    mimeType: text("mime_type"),
    size: bigint("size", { mode: "number" }).default(0),
    storageKey: text("storage_key").notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    organizationStorageKeyUnique: uniqueIndex("files_org_storage_key_unique").on(
      table.organizationId,
      table.storageKey,
    ),
    // Additional performance indexes
    filesOrgIdx: index("files_organization_id_idx").on(table.organizationId),
    filesCreatedAtIdx: index("files_created_at_idx").on(table.createdAt),
    filesUpdatedAtIdx: index("files_updated_at_idx").on(table.updatedAt),
  }),
);

export const fileRelations = relations(files, ({ one }) => ({
  organization: one(organizations, {
    fields: [files.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [files.createdBy],
    references: [users.id],
  }),
}));

export type FileModel = typeof files.$inferSelect;
