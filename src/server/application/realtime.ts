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
  // Invalidate client-side cache via real-time events
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

  // Invalidate server-side cache
  try {
    const tag = tagByTopic[params.topic](params.organizationId);
    revalidateTag(tag, {});
  } catch (error) {
    logger.warn("Server cache revalidation failed (ignored)", {
      domain: "realtime",
      operation: "revalidate",
      orgId: params.organizationId,
      meta: { topic: params.topic }
    }, error);
  }
}
