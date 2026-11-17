import { describe, it, expect, beforeEach } from "vitest";
import { rateLimiter } from "@/lib/security/rate-limiter";

describe("Rate Limiter (Brute-Force Protection)", () => {
  const testKey = "pair-attempt:192.168.1.50";

  beforeEach(() => {
    rateLimiter.reset(testKey);
  });

  it("should allow attempts up to max limit", () => {
    const maxAttempts = 3;
    const windowMs = 5000;

    const res1 = rateLimiter.check(testKey, maxAttempts, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = rateLimiter.check(testKey, maxAttempts, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = rateLimiter.check(testKey, maxAttempts, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4th attempt should be blocked
    const res4 = rateLimiter.check(testKey, maxAttempts, windowMs);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetInMs).toBeGreaterThan(0);
  });

  it("should reset attempts after explicit reset", () => {
    rateLimiter.check(testKey, 2, 5000);
    rateLimiter.check(testKey, 2, 5000);
    const blocked = rateLimiter.check(testKey, 2, 5000);
    expect(blocked.allowed).toBe(false);

    rateLimiter.reset(testKey);

    const allowedAgain = rateLimiter.check(testKey, 2, 5000);
    expect(allowedAgain.allowed).toBe(true);
    expect(allowedAgain.remaining).toBe(1);
  });
});
