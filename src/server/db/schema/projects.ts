import { relations } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./auth";

export const projectStatusEnum = pgEnum("project_status", [
  "BACKLOG",
  "IN_PROGRESS",
  "BLOCKED",
  "DONE",
]);

export const projectPriorityEnum = pgEnum("project_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    status: projectStatusEnum("status").default("BACKLOG").notNull(),
    priority: projectPriorityEnum("priority").default("MEDIUM").notNull(),
    createdBy: uuid("created_by")
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    organizationNameUnique: uniqueIndex("projects_org_name_unique").on(
      table.organizationId,
      table.name,
    ),
    // Additional performance indexes
    projectsOrgIdx: index("projects_organization_id_idx").on(table.organizationId),
    projectsCreatedAtIdx: index("projects_created_at_idx").on(table.createdAt),
    projectsUpdatedAtIdx: index("projects_updated_at_idx").on(table.updatedAt),
    projectsStatusIdx: index("projects_status_idx").on(table.status),
    projectsPriorityIdx: index("projects_priority_idx").on(table.priority),
    // Add composite index for common query pattern
    projectsOrgStatusPriorityIdx: index("projects_org_status_priority_idx").on(
      table.organizationId,
      table.status,
      table.priority
    ),
  }),
);

export const projectsRelations = relations(projects, ({ one }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
}));

export type ProjectModel = typeof projects.$inferSelect;
