"use client";

import { useEffect, useRef } from "react";
import type { RealtimeTopic } from "@/server/realtime/events";

type Handlers = Partial<Record<RealtimeTopic, () => void>>;

type Options = {
  organizationId?: string | null;
  handlers?: Handlers;
  enabled?: boolean;
};

export function useRealtimeSync({ organizationId, handlers = {}, enabled = true }: Options) {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!enabled || !organizationId) return;

    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (source) {
        source.close();
      }

      source = new EventSource(`/api/realtime?organizationId=${organizationId}`);

      const handleEvent = (topic: RealtimeTopic) => {
        const handler = handlersRef.current[topic];
        if (handler) {
          handler();
        }
      };

      source.addEventListener("projects", () => handleEvent("projects"));
      source.addEventListener("clients", () => handleEvent("clients"));
      source.addEventListener("files", () => handleEvent("files"));

      source.onerror = () => {
        source?.close();
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connect();
          }, 1500);
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      source?.close();
    };
  }, [enabled, organizationId]);
}
