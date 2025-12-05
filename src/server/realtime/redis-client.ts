import { logger } from "@/lib/logging";

type RedisModule = typeof import("ioredis");
type RedisCtor = RedisModule["default"];

let Redis: RedisCtor | null = null;

function getRedisCtor(): RedisCtor | null {
  if (Redis) return Redis;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("ioredis") as RedisModule;
    Redis = (mod as unknown as { default?: RedisCtor }).default ?? (mod as unknown as RedisCtor);
    return Redis;
  } catch (error) {
    logger.warn("Redis client not installed; realtime will be disabled", { domain: "realtime", operation: "load-client" }, error);
    return null;
  }
}

export function createRedisClient(url?: string) {
  const redisUrl = url ?? process.env.REDIS_URL;
  const ctor = getRedisCtor();
  if (!redisUrl || !ctor) {
    return null;
  }

  const client = new ctor(redisUrl);

  client.on("error", (error: unknown) => {
    logger.warn("Redis client error", { domain: "realtime", operation: "client-error" }, error);
  });

  return client;
}
