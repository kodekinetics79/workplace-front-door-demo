import { handle, json, readJson, clientKey, assertSameOrigin } from "@/lib/http";
import { verifyMfa, sessionCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
export const runtime = "nodejs";
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await rateLimit(`mfa:${clientKey(req)}`, 10, 600);
  const { challenge, code } = await readJson<{ challenge?: string; code?: string }>(req, 2048);
  const { token, staff } = await verifyMfa(String(challenge ?? ""), String(code ?? ""));
  return json({ staff }, 200, { "set-cookie": sessionCookie(token) });
});
