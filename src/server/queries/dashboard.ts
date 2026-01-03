import "server-only";

import { unstable_cache } from "next/cache";
import { db } from "@/server/db";
import { listProjectsByOrganization } from "@/server/db/repositories/projects-repo";
import { paginateClients } from "@/server/db/repositories/clients-repo";
import { listFiles } from "@/server/db/repositories/files-repo";

// Cache tags by domain. Keep this in sync with invalidateAndPublish in application layer.
export const DASHBOARD_PROJECTS_TAG = "dashboard:projects";
export const DASHBOARD_CLIENTS_TAG = "dashboard:clients";
export const DASHBOARD_FILES_TAG = "dashboard:files";

export function dashboardProjectsTag(orgId: string) {
  return `${DASHBOARD_PROJECTS_TAG}:${orgId}`;
}

export function dashboardClientsTag(orgId: string) {
  return `${DASHBOARD_CLIENTS_TAG}:${orgId}`;
}

export function dashboardFilesTag(orgId: string) {
  return `${DASHBOARD_FILES_TAG}:${orgId}`;
}

// Revalidate windows per domain (seconds). Adjust to business freshness needs.
const REVALIDATE_WINDOWS = {
  [DASHBOARD_PROJECTS_TAG]: 60,  // Increased from 30s - projects change less frequently
  [DASHBOARD_CLIENTS_TAG]: 120, // Increased from 20s - clients rarely change
  [DASHBOARD_FILES_TAG]: 30,    // Reduced from 45s - files may be accessed more frequently
} as const;

export function getProjectsSnapshot(organizationId: string) {
  const cached = unstable_cache(
    () => listProjectsByOrganization(db, organizationId),
    ["dashboard-projects", organizationId],
    {
      tags: [dashboardProjectsTag(organizationId)],
      revalidate: REVALIDATE_WINDOWS[DASHBOARD_PROJECTS_TAG],
    },
  );
  return cached();
}

export function getClientsPageSnapshot(params: {
  organizationId: string;
  page: number;
  pageSize: number;
  search?: string;
}) {
  const cached = unstable_cache(
    () =>
      paginateClients(db, {
        organizationId: params.organizationId,
        page: params.page,
        pageSize: params.pageSize,
        ...(params.search !== undefined && { search: params.search }),
      }),
    ["dashboard-clients", params.organizationId, String(params.page), String(params.pageSize), params.search ?? ""],
    {
      tags: [dashboardClientsTag(params.organizationId)],
      revalidate: REVALIDATE_WINDOWS[DASHBOARD_CLIENTS_TAG],
    },
  );

  return cached().then((result) => ({
    ...result,
    page: params.page,
    pageSize: params.pageSize,
  }));
}

export function getFilesSnapshot(organizationId: string) {
  const cached = unstable_cache(
    () => listFiles(db, organizationId),
    ["dashboard-files", organizationId],
    {
      tags: [dashboardFilesTag(organizationId)],
      revalidate: REVALIDATE_WINDOWS[DASHBOARD_FILES_TAG],
    },
  );
  return cached();
}