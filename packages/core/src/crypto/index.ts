// ─────────────────────────────────────────────────────────────────────────────
// Crypto utilities — Web Crypto API only (native in CF Workers + Node 18+)
// No Node.js crypto module — runs on the edge and in tests without polyfills
// ─────────────────────────────────────────────────────────────────────────────

const ENCODER = new TextEncoder();

// ── Random generation ─────────────────────────────────────────────────────────

export function generateRandomString(
  length: number,
  charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length]!)
    .join("");
}

export function generateToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64UrlEncode(buf);
}

export function generateOTP(digits = 6): string {
  const max = Math.pow(10, digits);
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0]! % max).padStart(digits, "0");
}

export function generateId(): string {
  return crypto.randomUUID();
}

// ── Hashing ───────────────────────────────────────────────────────────────────

export async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", ENCODER.encode(data));
  return hexEncode(new Uint8Array(buf));
}

export async function hashToken(token: string): Promise<string> {
  return sha256(token);
}

// ── Password hashing (PBKDF2-SHA512) ─────────────────────────────────────────
// CF Workers does not expose scrypt — PBKDF2 at 210k iterations is OWASP-recommended

const PBKDF2_ITERATIONS = 210_000;
const PBKDF2_KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-512" },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  const hash = new Uint8Array(derivedBits);
  return `pbkdf2:sha512:${PBKDF2_ITERATIONS}:${hexEncode(salt)}:${hexEncode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha512") return false;

  const iterations = parseInt(parts[2]!, 10);
  const salt = hexDecode(parts[3]!);
  const expectedHash = parts[4]!;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-512" },
    keyMaterial,
    PBKDF2_KEY_LENGTH * 8
  );

  return timingSafeEqual(hexEncode(new Uint8Array(derivedBits)), expectedHash);
}

// ── HMAC ──────────────────────────────────────────────────────────────────────

export async function hmacSign(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    ENCODER.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, ENCODER.encode(data));
  return base64UrlEncode(new Uint8Array(sig));
}

export async function hmacVerify(key: string, data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(key, data);
  return timingSafeEqual(expected, signature);
}

// ── JWT (HS256) ───────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

export async function signJWT(payload: Omit<JWTPayload, "iat">, secret: string): Promise<string> {
  const header = base64UrlEncode(ENCODER.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = base64UrlEncode(
    ENCODER.encode(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }))
  );
  const message = `${header}.${body}`;
  const sig = await hmacSign(secret, message);
  return `${message}.${sig}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [header, body, sig] = token.split(".");
    if (!header || !body || !sig) return null;
    const valid = await hmacVerify(secret, `${header}.${body}`, sig);
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body))) as JWTPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Cookie signing ────────────────────────────────────────────────────────────

export async function signCookieValue(value: string, secret: string): Promise<string> {
  const sig = await hmacSign(secret, value);
  return `${value}.${sig}`;
}

export async function unsignCookieValue(signed: string, secret: string): Promise<string | null> {
  const dotIndex = signed.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const value = signed.slice(0, dotIndex);
  const sig = signed.slice(dotIndex + 1);
  const valid = await hmacVerify(secret, value, sig);
  return valid ? value : null;
}

// ── AES-GCM encryption ────────────────────────────────────────────────────────

export async function encrypt(plaintext: string, secret: string): Promise<string> {
  const key = await deriveAesKey(secret);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENCODER.encode(plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return base64UrlEncode(combined);
}

export async function decrypt(encryptedB64: string, secret: string): Promise<string | null> {
  try {
    const key = await deriveAesKey(secret);
    const combined = base64UrlDecode(encryptedB64);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
}

async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", ENCODER.encode(secret), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: ENCODER.encode("gately-auth-aes"), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ── Encoding helpers ──────────────────────────────────────────────────────────

export function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]!);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function base64UrlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (padded.length % 4)) % 4;
  const base64 = padded + "=".repeat(padding);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
