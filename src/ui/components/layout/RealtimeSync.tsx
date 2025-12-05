"use client";

import { useCallback } from "react";
import { api } from "@/lib/trpc/client";
import { useRealtimeSync } from "@/lib/realtime/useRealtimeSync";

type RealtimeSyncProps = {
  organizationId: string;
};

export function RealtimeSync({ organizationId }: RealtimeSyncProps) {
  const utils = api.useUtils();

  const refreshProjects = useCallback(() => {
    utils.projects.list.invalidate();
  }, [utils]);

  const refreshClients = useCallback(() => {
    utils.clients.list.invalidate();
  }, [utils]);

  const refreshFiles = useCallback(() => {
    utils.files.list.invalidate();
  }, [utils]);

  useRealtimeSync({
    organizationId,
    handlers: {
      projects: refreshProjects,
      clients: refreshClients,
      files: refreshFiles,
    },
  });

  return null;
}
