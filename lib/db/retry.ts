import "server-only";

/**
 * Retry an idempotent DB read after short backoffs (200ms, 600ms) — absorbs
 * transient pooler blips (dead socket handed out after a deploy/pooler bounce,
 * momentary "max clients" bursts) instead of surfacing the global error page.
 * Safe ONLY for reads; never wrap writes.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 200 + i * 400));
    }
  }
  throw lastErr;
}
