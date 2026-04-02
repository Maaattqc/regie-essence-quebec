const requests = new Map<string, number[]>();

const WINDOW_MS = 1000;
const MAX_REQUESTS = 5;

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = requests.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    return false;
  }

  recent.push(now);
  requests.set(ip, recent);

  // Cleanup old IPs every 1000 entries
  if (requests.size > 1000) {
    for (const [key, vals] of requests) {
      if (vals.every((t) => now - t > WINDOW_MS * 10)) {
        requests.delete(key);
      }
    }
  }

  return true;
}

export function getIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
