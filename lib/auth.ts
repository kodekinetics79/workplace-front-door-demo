import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { q1, q } from "./db";
import { HttpError } from "./http";
import { can, type Permission, type Role } from "./rbac";
import { audit } from "./audit";
import { verifyTotp } from "./totp";

export const SESSION_COOKIE = "wp_staff";
const SESSION_HOURS = 8;
let dummyHash: string | null = null;
const dummy = async () => (dummyHash ??= await bcrypt.hash("timing-equalizer", 10));
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    // Fail closed: production never runs with a missing or weak signing key.
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SECRET !== "1") throw new Error("SESSION_SECRET (32+ chars) is required in production");
    return new TextEncoder().encode("dev-only-secret-change-me-in-production-0001");
  }
  return new TextEncoder().encode(s);
}

export type Staff = { id: string; email: string; name: string; role: Role };

type UserRow = { id: string; email: string; name: string; role: Role; password_hash: string; token_version: number; active: boolean; failed_logins: number; locked_until: string | null; mfa_secret: string | null };

async function issueSession(u: UserRow) {
  await q("UPDATE staff_users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = $1", [u.id]);
  const token = await new SignJWT({ role: u.role, tv: u.token_version, amr: u.mfa_secret ? ["pwd", "otp"] : ["pwd"] }).setProtectedHeader({ alg: "HS256" }).setSubject(u.id)
    .setIssuedAt().setExpirationTime(`${SESSION_HOURS}h`).sign(secret());
  await audit({ actorId: u.id, actorLabel: u.name, action: u.mfa_secret ? "Signed in (password + authenticator code)" : "Signed in", entity: "session" });
  return { token, staff: { id: u.id, email: u.email, name: u.name, role: u.role } };
}
async function failed(u: UserRow, what: string) {
  await q("UPDATE staff_users SET failed_logins = failed_logins + 1, locked_until = CASE WHEN failed_logins + 1 >= 5 THEN now() + interval '15 minutes' ELSE NULL END WHERE id = $1", [u.id]);
  await audit({ actorId: u.id, actorLabel: u.name, action: what, entity: "session" });
}

/** Step 1: password. Returns a session directly only for accounts without MFA; otherwise a 5-minute MFA challenge. */
export async function login(email: string, password: string): Promise<{ token: string; staff: Staff } | { mfa: string }> {
  const u = await q1<UserRow>("SELECT * FROM staff_users WHERE lower(email) = lower($1)", [email]);
  const generic = new HttpError(401, "invalid_credentials", "Email or password is incorrect");
  if (!u || !u.active) { await bcrypt.compare(password, await dummy()); throw generic; }
  if (u.locked_until && new Date(u.locked_until) > new Date()) throw new HttpError(423, "locked", "Account temporarily locked after repeated failed sign-ins. Try again in 15 minutes.");
  if (!(await bcrypt.compare(password, u.password_hash))) { await failed(u, "Failed sign-in (password)"); throw generic; }
  if (!u.mfa_secret) return issueSession(u);
  const mfa = await new SignJWT({ purpose: "mfa", tv: u.token_version }).setProtectedHeader({ alg: "HS256" }).setSubject(u.id).setIssuedAt().setExpirationTime("5m").sign(secret());
  return { mfa };
}

/** Step 2: authenticator code against the challenge from step 1. */
export async function verifyMfa(challenge: string, code: string) {
  let sub: string | undefined; let tv: unknown;
  try { const { payload } = await jwtVerify(challenge, secret(), { algorithms: ["HS256"] }); if (payload.purpose !== "mfa") throw new Error(); sub = payload.sub; tv = payload.tv; }
  catch { throw new HttpError(401, "mfa_expired", "Your sign-in expired. Start again."); }
  const u = await q1<UserRow>("SELECT * FROM staff_users WHERE id = $1", [sub]);
  if (!u || !u.active || u.token_version !== tv || !u.mfa_secret) throw new HttpError(401, "mfa_expired", "Your sign-in expired. Start again.");
  if (u.locked_until && new Date(u.locked_until) > new Date()) throw new HttpError(423, "locked", "Account temporarily locked after repeated failed sign-ins. Try again in 15 minutes.");
  if (!verifyTotp(u.mfa_secret, code.trim())) { await failed(u, "Failed sign-in (authenticator code)"); throw new HttpError(401, "bad_code", "That code is not right. Check your authenticator app and try again."); }
  return issueSession(u);
}

export function sessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${secure}`;
}
export const clearCookie = () => `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function readCookie(header: string | null, name: string) {
  if (!header) return null;
  for (const part of header.split(";")) { const [k, ...v] = part.trim().split("="); if (k === name) return v.join("="); }
  return null;
}

/** Validates token signature, expiry, account status and token version (server-side revocation). */
export async function staffFromToken(token: string | null | undefined): Promise<Staff | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (payload.purpose === "mfa") return null; // a half-finished sign-in is never a session
    const u = await q1<Staff & { token_version: number; active: boolean }>("SELECT id, email, name, role, token_version, active FROM staff_users WHERE id = $1", [payload.sub]);
    if (!u || !u.active || u.token_version !== payload.tv) return null;
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  } catch { return null; }
}

export const staffFromRequest = (req: Request) => staffFromToken(readCookie(req.headers.get("cookie"), SESSION_COOKIE));

export async function requirePermission(req: Request, p: Permission): Promise<Staff> {
  const s = await staffFromRequest(req);
  if (!s) throw new HttpError(401, "unauthenticated", "Sign in required");
  if (!can(s.role, p)) {
    await audit({ actorId: s.id, actorLabel: s.name, action: `Access denied: ${p}`, entity: "authorization", detail: { path: new URL(req.url).pathname } });
    throw new HttpError(403, "forbidden", "Your role cannot perform this action");
  }
  return s;
}

/** Sign out everywhere: bumps the token version so every issued token stops working. */
export async function revokeSessions(userId: string) { await q("UPDATE staff_users SET token_version = token_version + 1 WHERE id = $1", [userId]); }
