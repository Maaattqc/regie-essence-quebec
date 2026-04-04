import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting distribué via Upstash Redis (partagé entre toutes les instances serverless).
// En dev local, on utilise toujours le fallback mémoire pour éviter les timeouts.
const isDev = process.env.NODE_ENV === "development";

const redis =
  !isDev && process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

const upstashLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 s"),
    })
  : null;

// Fallback in-memory pour le dev local
const memoryRequests = new Map<string, number[]>();
const WINDOW_MS = 1000;
const MAX_REQUESTS = 5;

function memoryRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = memoryRequests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  memoryRequests.set(ip, recent);
  if (memoryRequests.size > 1000) {
    for (const [key, vals] of memoryRequests) {
      if (vals.every((t) => now - t > WINDOW_MS * 10)) memoryRequests.delete(key);
    }
  }
  return true;
}

export async function rateLimit(ip: string): Promise<boolean> {
  if (upstashLimiter) {
    try {
      const result = await Promise.race([
        upstashLimiter.limit(ip),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
      if (result) return result.success;
      return memoryRateLimit(ip);
    } catch {
      return memoryRateLimit(ip);
    }
  }
  return memoryRateLimit(ip);
}

export function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
