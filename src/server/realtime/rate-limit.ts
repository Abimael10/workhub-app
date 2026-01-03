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
        // Use Lua script for atomic increment and TTL setting
        const luaScript = `
          local current = redis.call("INCR", KEYS[1])
          if current == 1 then
            redis.call("PEXPIRE", KEYS[1], ARGV[1])
          end
          local ttl = redis.call("PTTL", KEYS[1])
          return {current, ttl}
        `;

        const result = await client.eval(luaScript, 1, redisKey, config.windowMs);
        const [count, rawTtl] = Array.isArray(result) ? result : [0, config.windowMs];
        const ttl = typeof rawTtl === 'number' ? rawTtl : config.windowMs;

        return {
          ok: count <= config.max,
          count: typeof count === 'number' ? count : 1,
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
        // Use Lua script for atomic decrement and cleanup
        const luaScript = `
          local current = redis.call("DECR", KEYS[1])
          if current <= 0 then
            redis.call("DEL", KEYS[1])
          end
          return current
        `;

        await client.eval(luaScript, 1, redisKey);
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
