import { describe, it, expect } from "vitest";
import {
  generateCryptographicPairingCode,
  hashPairingCode,
  verifyPairingCode,
  isPairingCodeExpired,
} from "@/lib/security/pairing-crypto";

describe("Pairing Crypto Security", () => {
  it("should generate a 6-digit numeric string", () => {
    const code = generateCryptographicPairingCode();
    expect(code).toMatch(/^\d{6}$/);
    const num = parseInt(code, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThanOrEqual(999999);
  });

  it("should generate different codes on subsequent invocations", () => {
    const code1 = generateCryptographicPairingCode();
    const code2 = generateCryptographicPairingCode();
    // High probability of different numbers in 900,000 range
    expect(code1).not.toBe(code2);
  });

  it("should hash the pairing code with user id and verify successfully", async () => {
    const userId = "usr-test-123456";
    const code = "842915";

    const hash = await hashPairingCode(code, userId);
    expect(hash).toHaveLength(64); // SHA-256 hex string

    const isValid = await verifyPairingCode(code, userId, hash);
    expect(isValid).toBe(true);
  });

  it("should reject an incorrect pairing code", async () => {
    const userId = "usr-test-123456";
    const correctCode = "842915";
    const wrongCode = "842916";

    const hash = await hashPairingCode(correctCode, userId);
    const isValid = await verifyPairingCode(wrongCode, userId, hash);
    expect(isValid).toBe(false);
  });

  it("should correctly identify expired pairing codes", () => {
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    const futureDate = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    expect(isPairingCodeExpired(pastDate)).toBe(true);
    expect(isPairingCodeExpired(futureDate)).toBe(false);
  });
});
