import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { projects, type ProjectModel } from "@/server/db/schema/projects";

export async function listProjectsByOrganization(db: Database, organizationId: string) {
  return db.query.projects.findMany({
    where: (fields, { eq }) =>
      eq(fields.organizationId, organizationId),
    orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function createProjectRecord(
  db: Database,
  data: Omit<ProjectModel, "id" | "createdAt" | "updatedAt">,
) {
  const [project] = await db
    .insert(projects)
    .values(data)
    .returning();
  return project;
}

export async function getProjectById(db: Database, params: { id: string; organizationId: string }) {
  return db.query.projects.findFirst({
    where: (fields, { and, eq }) =>
      and(
        eq(fields.id, params.id),
        eq(fields.organizationId, params.organizationId)
      ),
    with: {
      creator: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateProjectStatusRecord(
  db: Database,
  params: { id: string; organizationId: string; status: ProjectModel["status"] },
) {
  const [project] = await db
    .update(projects)
    .set({ status: params.status, updatedAt: new Date() })
    .where(and(eq(projects.id, params.id), eq(projects.organizationId, params.organizationId)))
    .returning();

  return project;
}

export async function updateProjectRecord(
  db: Database,
  params: { id: string; organizationId: string; data: Partial<Pick<ProjectModel, "name" | "description" | "priority">> },
) {
  const [project] = await db
    .update(projects)
    .set({ ...params.data, updatedAt: new Date() })
    .where(and(eq(projects.id, params.id), eq(projects.organizationId, params.organizationId)))
    .returning();

  return project;
}

export async function deleteProjectRecord(db: Database, params: { id: string; organizationId: string }) {
  const [deletedProject] = await db
    .delete(projects)
    .where(and(eq(projects.id, params.id), eq(projects.organizationId, params.organizationId)))
    .returning();

  return deletedProject;
}