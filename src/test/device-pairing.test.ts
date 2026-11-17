import { describe, it, expect } from "vitest";
import {
  generateCryptographicPairingCode,
  hashPairingCode,
  verifyPairingCode,
  isPairingCodeExpired,
} from "@/lib/security/pairing-crypto";
import { rateLimiter } from "@/lib/security/rate-limiter";

describe("Device Pairing & Security Management", () => {
  it("should enforce rate limiting during pairing brute-force attempts", () => {
    const ipKey = "pair:10.0.0.99";
    rateLimiter.reset(ipKey);

    // 5 attempts allowed
    for (let i = 0; i < 5; i++) {
      const res = rateLimiter.check(ipKey, 5, 10000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt blocked
    const blocked = rateLimiter.check(ipKey, 5, 10000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
  });

  it("should validate pairing code against owner-specific salted hash", async () => {
    const ownerA = "user-alice-111";
    const ownerB = "user-bob-222";
    const plainCode = "654321";

    const hashA = await hashPairingCode(plainCode, ownerA);
    const hashB = await hashPairingCode(plainCode, ownerB);

    // Same code for different users must yield distinct hashes
    expect(hashA).not.toBe(hashB);

    // Verification must succeed only for the matching owner
    expect(await verifyPairingCode(plainCode, ownerA, hashA)).toBe(true);
    expect(await verifyPairingCode(plainCode, ownerB, hashA)).toBe(false);
  });

  it("should deny expired pairing codes", () => {
    const pastExpiresAt = new Date(Date.now() - 1000).toISOString();
    expect(isPairingCodeExpired(pastExpiresAt)).toBe(true);
  });
});
