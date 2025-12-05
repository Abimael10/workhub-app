import { NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/getCurrentUser";
import { brokerReady, subscribeToRealtime, type RealtimeEvent } from "@/server/realtime/events";
import { getMembershipByUserAndOrganization } from "@/server/db/repositories/memberships-repo";
import { db } from "@/server/db";
import { createRedisClient } from "@/server/realtime/redis-client";
import { createRateLimiter, createReleaseLimiter } from "@/server/realtime/rate-limit";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const connectionLimiter = createRateLimiter(createRedisClient(), {
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  prefix: "realtime:connections",
});

const connectionReleaseLimiter = createReleaseLimiter(createRedisClient(), {
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  prefix: "realtime:connections",
});

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  const user = session?.user;

  if (!user?.organizationId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedOrgId = searchParams.get("organizationId") ?? user.organizationId;

  const membership = await getMembershipByUserAndOrganization(db, {
    userId: user.id,
    organizationId: requestedOrgId,
  });

  if (!membership) {
    return new Response("Forbidden", { status: 403 });
  }

  const organizationId = membership.organizationId;
  const encoder = new TextEncoder();

  if (!brokerReady) {
    return new Response("Realtime broker unavailable; set REDIS_URL to enable realtime updates.", { status: 503 });
  }

  const rateKey = getRateLimitKey(user.id, request);
  const limit = await connectionLimiter.acquire(rateKey);
  if (!limit.ok) {
    return new Response("Too many realtime connections", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(limit.ttlMs / 1000)) },
    });
  }

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent) => {
        if (event.organizationId !== organizationId) return;
        controller.enqueue(
          encoder.encode(`event: ${event.topic}\ndata:${JSON.stringify(event)}\n\n`),
        );
      };

      const unsubscribe = subscribeToRealtime(send);
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`event: ping\ndata:${Date.now()}\n\n`));
      }, 20000);

      controller.enqueue(encoder.encode(`event: ready\ndata:${JSON.stringify({ ok: true })}\n\n`));

      const close = () => {
        clearInterval(keepAlive);
        unsubscribe();
        controller.close();
        const rateKey = getRateLimitKey(user.id, request);
        connectionReleaseLimiter.release(rateKey);
      };

      request.signal.addEventListener("abort", close);
      cleanup = close;
    },
    cancel() {
      if (cleanup) {
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function getRateLimitKey(userId: string, request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  return `${userId}:${ip}`;
}
