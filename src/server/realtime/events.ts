import { EventEmitter } from "node:events";
import { logger } from "@/lib/logging";
import { createRedisClient } from "./redis-client";

export type RealtimeTopic = "projects" | "clients" | "files";

export type RealtimeEvent = {
  topic: RealtimeTopic;
  organizationId: string;
  action: "invalidate";
  entityId?: string;
};

type Broker = {
  publish: (event: RealtimeEvent) => Promise<void> | void;
  subscribe: (handler: (event: RealtimeEvent) => void) => () => void;
  kind: "memory" | "redis";
};

const CHANNEL = "realtime:events";

class MemoryBroker implements Broker {
  kind: Broker["kind"] = "memory";
  private bus = new EventEmitter();

  constructor() {
    this.bus.setMaxListeners(200);
  }

  publish(event: RealtimeEvent) {
    this.bus.emit("message", event);
  }

  subscribe(handler: (event: RealtimeEvent) => void) {
    this.bus.on("message", handler);
    return () => this.bus.off("message", handler);
  }
}

class RedisBroker implements Broker {
  kind: Broker["kind"] = "redis";
  private publisher: NonNullable<ReturnType<typeof createRedisClient>>;
  private subscriber: NonNullable<ReturnType<typeof createRedisClient>>;
  private handlers = new Set<(event: RealtimeEvent) => void>();
  private isSubscribed = false;

  constructor(url: string) {
    const publisher = createRedisClient(url);
    const subscriber = createRedisClient(url);
    if (!publisher || !subscriber) {
      throw new Error("Redis unavailable");
    }
    this.publisher = publisher;
    this.subscriber = subscriber;

    // Handle subscriber errors
    this.subscriber.on("error", (error: unknown) => {
      logger.error("Redis subscriber error", { domain: "realtime", operation: "subscribe" }, error);
    });

    this.subscriber.subscribe(CHANNEL).then(() => {
      this.isSubscribed = true;
      logger.info("Redis subscriber connected to channel", { domain: "realtime", operation: "subscribe" });
    }).catch((error: unknown) => {
      logger.error("Redis subscribe failed; falling back to memory broker", { domain: "realtime", operation: "subscribe" }, error);
      throw error;
    });

    this.subscriber.on("message", (...args: unknown[]) => {
      try {
        const channel = args[0] as string;
        const message = args[1] as string;
        if (channel === CHANNEL) {
          const parsed = JSON.parse(message) as RealtimeEvent;
          this.handlers.forEach((handler) => handler(parsed));
        }
      } catch (error) {
        logger.warn("Failed to parse realtime message", { domain: "realtime", operation: "parse" }, error);
      }
    });
  }

  async publish(event: RealtimeEvent) {
    if (this.publisher && this.isSubscribed) {
      await this.publisher.publish(CHANNEL, JSON.stringify(event));
    }
  }

  subscribe(handler: (event: RealtimeEvent) => void) {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  // Add cleanup method for proper resource management
  cleanup() {
    if (this.isSubscribed) {
      this.subscriber.unsubscribe(CHANNEL);
      this.isSubscribed = false;
    }
    this.handlers.clear();
  }
}

function createBroker(): Broker {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    try {
      return new RedisBroker(redisUrl);
    } catch (error) {
      logger.warn("Realtime broker fell back to memory; set REDIS_URL to enable distributed events", { domain: "realtime", operation: "init" }, error);
    }
  } else {
    logger.warn("REDIS_URL missing; realtime will run in degraded in-memory mode", { domain: "realtime", operation: "init" });
  }
  return new MemoryBroker();
}

const broker = createBroker();

// Add cleanup on process termination for graceful shutdown
process.on('SIGINT', () => {
  if (broker instanceof RedisBroker) {
    broker.cleanup();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  if (broker instanceof RedisBroker) {
    broker.cleanup();
  }
  process.exit(0);
});

export const brokerKind = broker.kind;
export const brokerReady = broker.kind === "redis";

export function publishRealtimeEvent(event: RealtimeEvent) {
  try {
    return broker.publish(event);
  } catch (error) {
    logger.warn("Realtime publish failed", { domain: "realtime", operation: "publish", orgId: event.organizationId }, error);
  }
}

export function subscribeToRealtime(handler: (event: RealtimeEvent) => void) {
  return broker.subscribe(handler);
}
