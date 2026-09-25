/**
 * Minimal fixed-window, in-memory rate limiter. Good enough for a single instance;
 * use a shared store (e.g. Redis) when running multiple server instances.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.TRANSLATE_RATE_LIMIT_PER_MINUTE ?? 30);

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, now = Date.now()): boolean {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return true;
  }
  entry.count++;
  return entry.count <= MAX_REQUESTS;
}
