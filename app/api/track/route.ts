import { handle, json, readJson, clientKey } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";
import { lookupStatus } from "@/lib/referrals";
import { track } from "@/lib/analytics";

export const runtime = "nodejs";
export const POST = handle(async (req) => {
  const key = clientKey(req);
  await rateLimit(`track:${key}`, 10, 600); // slows reference-number guessing
  const { ref, check } = await readJson<{ ref?: string; check?: string }>(req, 512);
  const r = await lookupStatus(String(ref ?? ""), String(check ?? ""));
  await track("track_lookup", "en", key, { found: !!r });
  return r ? json(r) : json({ error: "not_found" }, 404);
});
