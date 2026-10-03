import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

/**
 * Shared-password admin auth.
 *
 * The admin password lives in the ADMIN_PASSWORD secret. Logging in issues a
 * stateless, HMAC-signed session cookie (`<expiresAtMs>.<signature>`). The
 * signing key is derived from SESSION_SECRET *and* the password, so rotating
 * the password invalidates every existing session. When ADMIN_PASSWORD is not
 * set, admin is locked for everyone (fail closed).
 */

export const ADMIN_COOKIE = "tb_admin";
const COOKIE_PATH = "/api/admin";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function adminPassword(): string | null {
  const p = process.env.ADMIN_PASSWORD;
  return p && p.length > 0 ? p : null;
}

export function isAdminConfigured(): boolean {
  return adminPassword() !== null;
}

function signingKey(password: string): Buffer {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "tb-admin")
    .update(`admin-session:${password}`)
    .digest();
}

function sign(expiresAt: number, password: string): string {
  return createHmac("sha256", signingKey(password)).update(String(expiresAt)).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  const p = adminPassword();
  return p !== null && safeEqual(candidate, p);
}

export function hasValidSession(req: Request): boolean {
  const p = adminPassword();
  if (!p) return false;
  const raw: unknown = req.cookies?.[ADMIN_COOKIE];
  if (typeof raw !== "string") return false;
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const expiresAt = Number(raw.slice(0, dot));
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  return safeEqual(raw.slice(dot + 1), sign(expiresAt, p));
}

function isHttps(req: Request): boolean {
  return req.secure || req.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https";
}

export function issueSession(req: Request, res: Response): void {
  const p = adminPassword();
  if (!p) throw new Error("ADMIN_PASSWORD not configured");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  res.cookie(ADMIN_COOKIE, `${expiresAt}.${sign(expiresAt, p)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: isHttps(req),
    path: COOKIE_PATH,
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSession(req: Request, res: Response): void {
  res.clearCookie(ADMIN_COOKIE, { httpOnly: true, sameSite: "strict", secure: isHttps(req), path: COOKIE_PATH });
}

/** Rejects any request without a valid admin session. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAdminConfigured()) {
    res.status(503).json({ error: "Admin is locked: the ADMIN_PASSWORD secret is not set" });
    return;
  }
  if (!hasValidSession(req)) {
    res.status(401).json({ error: "Admin login required" });
    return;
  }
  next();
}

// ---------------------------------------------------------------------------
// Failed-login throttle (in-memory, per client IP)
// ---------------------------------------------------------------------------

const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
// NOTE: this state is per-process. On a single long-lived server (Replit,
// Render) the limit is global. On serverless (Vercel) each warm instance keeps
// its own counter, so the effective limit is MAX_FAILURES per instance. Move
// this to the database or a KV store if the throttle needs to be strict.
const failures = new Map<string, { count: number; resetAt: number }>();

/**
 * Identify the client for throttling purposes, using only headers the hosting
 * proxy sets itself (a client-supplied value must never be trusted here, or
 * the throttle can be bypassed by rotating a forged header).
 *
 * Proxies disagree on which end of X-Forwarded-For is trustworthy:
 *   - Replit appends the real client address, so the RIGHT-most entry is safe.
 *   - Vercel puts the client IP FIRST, and additionally sets its own
 *     `x-vercel-forwarded-for` / `x-real-ip`, which a client cannot forge.
 *
 * Vercel's dedicated headers are therefore preferred when present, and the
 * Replit right-most behaviour is kept as the fallback.
 */
export function clientKey(req: Request): string {
  const vercel = req.get("x-vercel-forwarded-for") ?? req.get("x-real-ip");
  const trusted = vercel?.split(",")[0]?.trim();
  if (trusted) return trusted;

  const xff = req.get("x-forwarded-for");
  const last = xff?.split(",").map((s) => s.trim()).filter(Boolean).pop();
  return last ?? req.socket.remoteAddress ?? "unknown";
}

export function isThrottled(key: string): boolean {
  const f = failures.get(key);
  if (!f) return false;
  if (f.resetAt < Date.now()) {
    failures.delete(key);
    return false;
  }
  return f.count >= MAX_FAILURES;
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const f = failures.get(key);
  if (!f || f.resetAt < now) failures.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else f.count += 1;
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
