/**
 * In-memory sliding window rate limiter for security-sensitive actions
 * (e.g., pairing attempts, login attempts, credential generation).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();

  /**
   * Checks whether an action for a given key is allowed.
   * @param key Unique identifier (e.g. `pair:ip_address` or `login:email`)
   * @param maxAttempts Maximum permitted attempts within the window
   * @param windowMs Time window in milliseconds
   */
  public check(
    key: string,
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000 // default 15 minutes
  ): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetAt) {
      // First attempt or window has reset
      this.store.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        remaining: maxAttempts - 1,
        resetInMs: windowMs,
      };
    }

    if (existing.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetInMs: Math.max(0, existing.resetAt - now),
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: maxAttempts - existing.count,
      resetInMs: Math.max(0, existing.resetAt - now),
    };
  }

  public reset(key: string): void {
    this.store.delete(key);
  }
}

export const rateLimiter = new InMemoryRateLimiter();
