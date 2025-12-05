import { revalidateTag } from "next/cache";
import { publishRealtimeEvent, type RealtimeTopic } from "@/server/realtime/events";
import { logger } from "@/lib/logging";
import { dashboardClientsTag, dashboardFilesTag, dashboardProjectsTag } from "@/server/queries/dashboard";

const tagByTopic: Record<RealtimeTopic, (orgId: string) => string> = {
  projects: dashboardProjectsTag,
  clients: dashboardClientsTag,
  files: dashboardFilesTag,
};

export async function invalidateAndPublish(params: { topic: RealtimeTopic; organizationId: string; entityId?: string }) {
  // Revalidation happens via client-side mechanisms in Next.js 16
  try {
    const event = {
      topic: params.topic,
      organizationId: params.organizationId,
      action: "invalidate" as const,
      ...(params.entityId !== undefined && { entityId: params.entityId }),
    };
    const maybePromise = publishRealtimeEvent(event);
    if (maybePromise instanceof Promise) {
      await maybePromise;
    }
  } catch (error) {
    logger.warn("Realtime publish failed (ignored)", { domain: "realtime", operation: "publish", orgId: params.organizationId }, error);
  }
}
