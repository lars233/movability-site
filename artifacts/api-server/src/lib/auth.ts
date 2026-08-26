import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  type BinaryLike,
} from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { getDb } from "./cms-db";
import { logger } from "./logger";

// Strict by default: anything other than an explicit "development" is treated
// as production. Forgetting to set NODE_ENV on a host must not silently enable
// development fallbacks like a default password.
const IS_PRODUCTION = process.env["NODE_ENV"] !== "development";

export const COOKIE_NAME = "cms_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/* ── secrets & credentials ──────────────────────────────────────────────
 * Production refuses to start without an explicit secret and password —
 * there is deliberately no usable default. Development falls back to a
 * secret generated fresh on every boot, so a leaked repo grants nothing.
 * -------------------------------------------------------------------- */

function loadSecret(): string {
  const configured = process.env["SESSION_SECRET"];
  if (configured && configured.length >= 32) return configured;

  if (IS_PRODUCTION) {
    throw new Error(
      "SESSION_SECRET is required in production and must be at least 32 characters. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
  }
  if (configured) {
    logger.warn("SESSION_SECRET is shorter than 32 characters — ignoring it in development.");
  }
  logger.warn("No SESSION_SECRET set — using a random development secret. Sessions end on restart.");
  return randomBytes(48).toString("hex");
}

const SECRET = loadSecret();

export const ADMIN_USER = process.env["ADMIN_USERNAME"] ?? "admin";

/** scrypt parameters — deliberately slow, so guessing is expensive. */
const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN, { N: SCRYPT_COST });
  return `scrypt$${SCRYPT_COST}$${salt}$${derived.toString("hex")}`;
}

type Credential =
  | { kind: "hash"; value: string }
  | { kind: "plain"; value: string };

function loadCredential(): Credential {
  const hash = process.env["ADMIN_PASSWORD_HASH"];
  if (hash) {
    if (!hash.startsWith("scrypt$")) {
      throw new Error(
        "ADMIN_PASSWORD_HASH is not a valid scrypt hash. Generate one with: node hash-password.mjs",
      );
    }
    return { kind: "hash", value: hash };
  }

  const plain = process.env["ADMIN_PASSWORD"];
  if (plain) {
    if (IS_PRODUCTION) {
      logger.warn(
        "ADMIN_PASSWORD is set in plain text. Prefer ADMIN_PASSWORD_HASH — generate one with: node hash-password.mjs",
      );
    }
    return { kind: "plain", value: plain };
  }

  if (IS_PRODUCTION) {
    throw new Error(
      "ADMIN_PASSWORD_HASH (preferred) or ADMIN_PASSWORD must be set in production. " +
        "There is no default admin password.",
    );
  }
  logger.warn("No admin password configured — falling back to the development password 'dev-password'.");
  return { kind: "plain", value: "dev-password" };
}

const CREDENTIAL = loadCredential();

/**
 * Constant-time comparison that cannot throw on a length mismatch.
 *
 * Both sides are HMAC'd first, so the buffers compared are always 32 bytes
 * regardless of input length. That removes the length oracle: a wrong-length
 * guess is indistinguishable from a right-length one.
 */
function safeEqual(a: BinaryLike, b: BinaryLike): boolean {
  const key = randomBytes(32);
  const left = createHmac("sha256", key).update(a).digest();
  const right = createHmac("sha256", key).update(b).digest();
  return timingSafeEqual(left, right);
}

function verifyPassword(password: string): boolean {
  if (CREDENTIAL.kind === "plain") return safeEqual(password, CREDENTIAL.value);

  const [, costRaw, salt, expected] = CREDENTIAL.value.split("$");
  const cost = Number(costRaw);
  if (!salt || !expected || Number.isNaN(cost)) return false;
  try {
    const derived = scryptSync(password, salt, expected.length / 2, { N: cost });
    return safeEqual(derived, Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** Verifies a login attempt. Username and password are checked together so
 *  the response never reveals which half was wrong. */
export function verifyCredentials(username: string, password: string): boolean {
  const userOk = safeEqual(username, ADMIN_USER);
  const passOk = verifyPassword(password);
  return userOk && passOk;
}

/* ── session revocation ─────────────────────────────────────────────────
 * Tokens stay stateless, but every token carries its issue time and the
 * server keeps a "not valid before" watermark. Signing out (or changing the
 * password) moves the watermark forward, which invalidates tokens already
 * handed out — including any an attacker may hold.
 * -------------------------------------------------------------------- */

function getRevocationWatermark(): number {
  const row = getDb()
    .prepare(`SELECT value FROM auth_state WHERE key = 'revoked_before'`)
    .get() as { value: string } | undefined;
  return row ? Number(row.value) || 0 : 0;
}

export function revokeAllSessions(): void {
  getDb()
    .prepare(
      `INSERT INTO auth_state (key, value) VALUES ('revoked_before', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(String(Date.now()));
}

/** Bumps the watermark whenever the configured password changes, so old
 *  sessions cannot outlive a credential rotation. */
export function revokeSessionsIfCredentialChanged(): void {
  const fingerprint = createHmac("sha256", SECRET)
    .update(`${ADMIN_USER}:${CREDENTIAL.value}`)
    .digest("hex");

  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM auth_state WHERE key = 'credential_fingerprint'`)
    .get() as { value: string } | undefined;

  if (row?.value === fingerprint) return;

  db.prepare(
    `INSERT INTO auth_state (key, value) VALUES ('credential_fingerprint', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
  ).run(fingerprint);

  if (row) {
    logger.info("Admin credentials changed — existing sessions revoked.");
    revokeAllSessions();
  }
}

/* ── tokens ─────────────────────────────────────────────────────────── */

export function makeToken(username: string): string {
  const payload = `${username}:${Date.now()}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyToken(token: string): string | null {
  try {
    const parts = Buffer.from(token, "base64url").toString("utf8").split(":");
    if (parts.length !== 3) return null;
    const [user, issuedRaw, sig] = parts;

    const expected = createHmac("sha256", SECRET).update(`${user}:${issuedRaw}`).digest("hex");
    if (!safeEqual(sig, expected)) return null;

    // The signature only proves the token came from us; it must also name the
    // account that is actually configured.
    if (!safeEqual(user, ADMIN_USER)) return null;

    const issued = Number(issuedRaw);
    if (!Number.isFinite(issued)) return null;
    if (Date.now() - issued > SESSION_TTL_MS) return null;
    if (issued < getRevocationWatermark()) return null;

    return user;
  } catch {
    return null;
  }
}

export function cookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: SESSION_TTL_MS,
    path: "/",
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token || !verifyToken(token)) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

/* ── login rate limiting ────────────────────────────────────────────────
 * In-memory, per-IP. Enough for a single-admin CMS on one instance; if the
 * app is ever scaled to several instances this should move to the database.
 * -------------------------------------------------------------------- */

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; first: number; blockedUntil: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (now - entry.first > WINDOW_MS && now > entry.blockedUntil) attempts.delete(ip);
  }
}, WINDOW_MS).unref();

export function loginBlockedFor(ip: string): number {
  const entry = attempts.get(ip);
  if (!entry) return 0;
  const remaining = entry.blockedUntil - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now, blockedUntil: 0 });
    return;
  }

  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    // Back off harder the longer someone keeps guessing: 1, 2, 4, 8 … minutes,
    // capped at an hour.
    const overshoot = entry.count - MAX_FAILURES;
    const lockMs = Math.min(60 * 60 * 1000, 60 * 1000 * 2 ** overshoot);
    entry.blockedUntil = now + lockMs;
  }
}

export function clearLoginFailures(ip: string): void {
  attempts.delete(ip);
}
