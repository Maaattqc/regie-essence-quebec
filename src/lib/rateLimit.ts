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

// Limiteurs par profil d'endpoint
const upstashLimiters = redis
  ? {
      default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "1 s") }),
      strict: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(2, "1 s") }),
      relaxed: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 s") }),
    }
  : null;

export type RateLimitProfile = "default" | "strict" | "relaxed";

// Fallback in-memory pour le dev local (LRU avec taille max)
const MAX_KEYS = 2048;
const memoryRequests = new Map<string, number[]>();

const PROFILES: Record<RateLimitProfile, { windowMs: number; max: number }> = {
  default: { windowMs: 1000, max: 5 },
  strict: { windowMs: 1000, max: 2 },
  relaxed: { windowMs: 1000, max: 10 },
};

function memoryRateLimit(ip: string, profile: RateLimitProfile = "default"): boolean {
  const { windowMs, max } = PROFILES[profile];
  const key = `${profile}:${ip}`;
  const now = Date.now();
  const timestamps = memoryRequests.get(key) || [];
  const recent = timestamps.filter((t) => now - t < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  // LRU : supprimer puis réinsérer pour placer en fin de Map (plus récent)
  memoryRequests.delete(key);
  memoryRequests.set(key, recent);
  // Évincer les entrées les plus anciennes si on dépasse la limite
  if (memoryRequests.size > MAX_KEYS) {
    const keysIter = memoryRequests.keys();
    let toDelete = memoryRequests.size - MAX_KEYS;
    while (toDelete-- > 0) {
      const oldest = keysIter.next().value;
      if (oldest) memoryRequests.delete(oldest);
    }
  }
  return true;
}

export async function rateLimit(ip: string, profile: RateLimitProfile = "default"): Promise<boolean> {
  if (upstashLimiters) {
    try {
      const result = await Promise.race([
        upstashLimiters[profile].limit(ip),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]);
      if (result) return result.success;
      return memoryRateLimit(ip, profile);
    } catch {
      return memoryRateLimit(ip, profile);
    }
  }
  return memoryRateLimit(ip, profile);
}

export function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
