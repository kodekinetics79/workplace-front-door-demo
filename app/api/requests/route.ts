import { handle, json, readJson, clientKey } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { createReferral } from "@/lib/referrals";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";
export const POST = handle(async (req) => {
  const key = clientKey(req);
  await rateLimit(`req:${key}`, 8, 600); // 8 submissions per device/IP per 10 minutes
  const body = await readJson<Record<string, unknown>>(req);
  const result = await createReferral(body);
  if (!result.ok) return json({ errors: result.errors }, 422);
  await track("request_submit", String(body.lang ?? "en"), key, { kind: result.kind, sms: result.smsSent });
  return json({ ref: result.ref, smsSent: result.smsSent }, 201);
});
