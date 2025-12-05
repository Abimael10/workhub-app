import type Redis from "ioredis";
import { logger } from "@/lib/logging";

type AcquireResult = { ok: true; count: number; ttlMs: number } | { ok: false; count: number; ttlMs: number };

type RateLimiter = {
  acquire: (key: string) => Promise<AcquireResult>;
};

type Config = {
  windowMs: number;
  max: number;
  prefix: string;
};

function createInMemoryLimiter(config: Config): RateLimiter {
  const buckets = new Map<string, { count: number; windowStart: number }>();
  return {
    async acquire(key: string) {
      const now = Date.now();
      const entry = buckets.get(key);
      if (!entry || now - entry.windowStart > config.windowMs) {
        buckets.set(key, { count: 1, windowStart: now });
        return { ok: true, count: 1, ttlMs: config.windowMs };
      }
      entry.count += 1;
      buckets.set(key, entry);
      return {
        ok: entry.count <= config.max,
        count: entry.count,
        ttlMs: config.windowMs - (now - entry.windowStart),
      };
    },
  };
}

function createRedisLimiter(client: Redis, config: Config): RateLimiter {
  return {
    async acquire(key: string) {
      const redisKey = `${config.prefix}:${key}`;
      try {
        const count = await (client as any).incr(redisKey);
        if (count === 1) {
          await (client as any).pexpire(redisKey, config.windowMs);
        }
        const ttl = await (client as any).pttl(redisKey);

        return {
          ok: count <= config.max,
          count,
          ttlMs: ttl > 0 ? ttl : config.windowMs,
        };
      } catch (error) {
        logger.warn("Redis rate limiter failed; falling back to allow", { domain: "realtime", operation: "rate-limit" }, error);
        return { ok: true, count: 1, ttlMs: config.windowMs };
      }
    },
  };
}

export function createRateLimiter(client: Redis | null, config: Config): RateLimiter {
  if (client) {
    return createRedisLimiter(client, config);
  }
  return createInMemoryLimiter(config);
}

type ReleaseLimiter = {
  release: (key: string) => Promise<void>;
};

function createInMemoryReleaseLimiter(): ReleaseLimiter {
  return {
    async release(_key: string) {
      // For in-memory limiter, no explicit release needed since it's automatic
    },
  };
}

function createRedisReleaseLimiter(client: Redis, config: Config): ReleaseLimiter {
  return {
    async release(key: string) {
      try {
        const redisKey = `${config.prefix}:${key}`;
        await (client as any).decr(redisKey); // Decrement the counter
        // Add check to delete key if count reaches 0
        const count = await (client as any).get(redisKey);
        if (count && parseInt(count as string) <= 0) {
          await (client as any).del(redisKey); // Clean up if counter is 0 or negative
        }
      } catch (error) {
        logger.warn("Redis release limiter failed", { domain: "realtime", operation: "rate-limit-release" }, error);
      }
    },
  };
}

export function createReleaseLimiter(client: Redis | null, config: Config): ReleaseLimiter {
  if (client) {
    return createRedisReleaseLimiter(client, config);
  }
  return createInMemoryReleaseLimiter();
}
