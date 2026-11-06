import { handle, json, readJson, clientKey } from "@/lib/http";
import { q1 } from "@/lib/db";
import { totp } from "@/lib/totp";
import { rateLimit } from "@/lib/ratelimit";
import { DEMO_ACCOUNTS } from "@/lib/seed";
export const runtime = "nodejs";
// Evaluator convenience for the published DEMO accounts only, so reviewers can see real MFA without installing an app.
// Disabled unless DEMO_MODE=1; never available for any other account.
export const POST = handle(async (req) => {
  if (process.env.DEMO_MODE !== "1" && process.env.NODE_ENV === "production") return json({ error: "disabled" }, 404);
  await rateLimit(`democode:${clientKey(req)}`, 30, 600);
  const { email } = await readJson<{ email?: string }>(req, 512);
  if (!DEMO_ACCOUNTS.some((a) => a.email === String(email ?? "").toLowerCase())) return json({ error: "not_demo" }, 404);
  const u = await q1<{ mfa_secret: string | null }>("SELECT mfa_secret FROM staff_users WHERE email = $1", [String(email).toLowerCase()]);
  if (!u?.mfa_secret) return json({ error: "no_mfa" }, 404);
  return json({ code: totp(u.mfa_secret), secondsLeft: 30 - (Math.floor(Date.now() / 1000) % 30) });
});
