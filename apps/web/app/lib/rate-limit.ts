import {
  INGEST_RATE_LIMIT_WINDOW_MS,
  INGEST_RATE_LIMIT_MAX_REQUESTS,
} from "@faultline/shared";

const store = new Map<string, { count: number; resetAt: number }>();

function prune() {
  const now = Date.now();
  for (const [key, v] of store.entries()) {
    if (v.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(key: string): boolean {
  prune();
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) {
    store.set(key, { count: 1, resetAt: now + INGEST_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + INGEST_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= INGEST_RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function getRateLimitKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "default";
}
