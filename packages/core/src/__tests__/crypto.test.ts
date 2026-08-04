// ─────────────────────────────────────────────────────────────────────────────
// Crypto tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateOTP,
  generateId,
  sha256,
  signJWT,
  verifyJWT,
  signCookieValue,
  unsignCookieValue,
  encrypt,
  decrypt,
  hmacSign,
  hmacVerify,
} from "../crypto/index.js";

describe("hashPassword / verifyPassword", () => {
  it("hashes a password and verifies it", async () => {
    const hash = await hashPassword("supersecret123");
    expect(hash).toMatch(/^pbkdf2:sha512:/);
    expect(await verifyPassword("supersecret123", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("produces unique hashes each time (different salts)", async () => {
    const [a, b] = await Promise.all([
      hashPassword("same"),
      hashPassword("same"),
    ]);
    expect(a).not.toBe(b);
  });
});

describe("generateToken", () => {
  it("generates a URL-safe base64 string", () => {
    const t = generateToken(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("produces unique tokens", () => {
    const set = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(set.size).toBe(100);
  });
});

describe("generateOTP", () => {
  it("generates a 6-digit numeric string by default", () => {
    const otp = generateOTP();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("respects custom digit length", () => {
    expect(generateOTP(8)).toMatch(/^\d{8}$/);
  });
});

describe("generateId", () => {
  it("generates a valid UUID v4", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe("sha256", () => {
  it("produces a deterministic 64-char hex digest", async () => {
    const hash = await sha256("hello");
    expect(hash).toHaveLength(64);
    expect(await sha256("hello")).toBe(hash);
  });
});

describe("HMAC sign / verify", () => {
  it("signs and verifies a message", async () => {
    const sig = await hmacSign("secret", "payload");
    expect(await hmacVerify("secret", "payload", sig)).toBe(true);
  });

  it("rejects invalid signature", async () => {
    expect(await hmacVerify("secret", "payload", "badsig")).toBe(false);
  });
});

describe("signJWT / verifyJWT", () => {
  it("creates and verifies a valid JWT", async () => {
    const token = await signJWT(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      "secret"
    );
    const payload = await verifyJWT(token, "secret");
    expect(payload?.sub).toBe("user-1");
  });

  it("rejects a tampered JWT", async () => {
    const token = await signJWT(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      "secret"
    );
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(await verifyJWT(tampered, "secret")).toBeNull();
  });

  it("rejects an expired JWT", async () => {
    const token = await signJWT(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) - 1 }, // already expired
      "secret"
    );
    expect(await verifyJWT(token, "secret")).toBeNull();
  });

  it("rejects JWT signed with wrong secret", async () => {
    const token = await signJWT(
      { sub: "user-1", exp: Math.floor(Date.now() / 1000) + 3600 },
      "correct-secret"
    );
    expect(await verifyJWT(token, "wrong-secret")).toBeNull();
  });
});

describe("signCookieValue / unsignCookieValue", () => {
  it("signs and unsigns a cookie value", async () => {
    const signed = await signCookieValue("session-token-abc", "mysecret");
    expect(await unsignCookieValue(signed, "mysecret")).toBe("session-token-abc");
  });

  it("returns null for tampered value", async () => {
    const signed = await signCookieValue("value", "secret");
    const tampered = signed.slice(0, -3) + "XXX";
    expect(await unsignCookieValue(tampered, "secret")).toBeNull();
  });

  it("returns null for wrong secret", async () => {
    const signed = await signCookieValue("value", "right");
    expect(await unsignCookieValue(signed, "wrong")).toBeNull();
  });
});

describe("encrypt / decrypt", () => {
  it("encrypts and decrypts a string", async () => {
    const encrypted = await encrypt("super secret data", "encryption-key");
    expect(encrypted).not.toBe("super secret data");
    const decrypted = await decrypt(encrypted, "encryption-key");
    expect(decrypted).toBe("super secret data");
  });

  it("returns null for wrong key", async () => {
    const encrypted = await encrypt("secret", "right-key");
    const result = await decrypt(encrypted, "wrong-key");
    expect(result).toBeNull();
  });

  it("returns null for corrupted ciphertext", async () => {
    const result = await decrypt("notvalidbase64!!!", "key");
    expect(result).toBeNull();
  });
});
