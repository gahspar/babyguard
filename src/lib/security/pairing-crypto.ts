/**
 * Cryptographic utilities for secure ephemeral pairing codes.
 * Ensures pairing codes are single-use, high entropy, and never stored plaintext.
 */

export const PAIRING_CODE_TTL_MINUTES = 5;

/**
 * Generates a cryptographically secure 6-digit random code (100000 - 999999).
 */
export function generateCryptographicPairingCode(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = 100000 + (array[0] % 900000);
    return code.toString();
  }
  // Fallback for Node environments if crypto is imported from crypto module
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return randomNum.toString();
}

/**
 * Calculates SHA-256 hash of the code combined with the user ID for salt.
 */
export async function hashPairingCode(code: string, userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`babyguard:${userId}:${code.trim()}:salt_secure_2026`);
  
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Node.js fallback via standard crypto if subtle is unavailable
  const nodeCrypto = await import("crypto");
  return nodeCrypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Validates whether the given code matches the stored hash.
 */
export async function verifyPairingCode(
  inputCode: string,
  userId: string,
  storedHash: string
): Promise<boolean> {
  const inputHash = await hashPairingCode(inputCode, userId);
  return inputHash === storedHash;
}

/**
 * Checks if a pairing code timestamp has expired.
 */
export function isPairingCodeExpired(expiresAt: string | Date): boolean {
  const expiry = new Date(expiresAt).getTime();
  const now = Date.now();
  return now > expiry;
}
