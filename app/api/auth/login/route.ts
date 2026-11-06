import { handle, json, readJson, clientKey, assertSameOrigin } from "@/lib/http";
import { login, sessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await rateLimit(`login:${clientKey(req)}`, 10, 600);
  const { email, password } = await readJson<{ email?: string; password?: string }>(req, 1024);
  const r = await login(String(email ?? "").slice(0, 120), String(password ?? "").slice(0, 200));
  if ("mfa" in r) return json({ mfa: r.mfa });
  return json({ staff: r.staff }, 200, { "set-cookie": sessionCookie(r.token) });
});
