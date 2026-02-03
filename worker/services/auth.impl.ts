import type { PasswordService, TokenService } from "./auth.service";

// Helper functions for hex encoding/decoding
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// PBKDF2 password hashing with Web Crypto API
const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 256; // bits

export function createPasswordService(): PasswordService {
  return {
    async hash(password: string): Promise<string> {
      const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      const encoder = new TextEncoder();

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );

      const hash = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations: PBKDF2_ITERATIONS,
          hash: "SHA-256",
        },
        key,
        HASH_LENGTH,
      );

      return toHex(salt) + ":" + toHex(new Uint8Array(hash));
    },

    async verify(password: string, stored: string): Promise<boolean> {
      const [saltHex, hashHex] = stored.split(":");
      if (!saltHex || !hashHex) {
        return false;
      }

      const salt = fromHex(saltHex);
      const encoder = new TextEncoder();

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"],
      );

      const hash = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt.buffer as ArrayBuffer,
          iterations: PBKDF2_ITERATIONS,
          hash: "SHA-256",
        },
        key,
        HASH_LENGTH,
      );

      return toHex(new Uint8Array(hash)) === hashHex;
    },
  };
}

export function createTokenService(): TokenService {
  return {
    generate(): string {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return toHex(bytes);
    },
  };
}
