import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { handleInbound } from "@/lib/sms";
import { q1 } from "@/lib/db";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
// Demo-only: lets evaluators see STOP, START, HELP and C/R replies without a real handset.
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const me = await requirePermission(req, "sms.send");
  const { referralId, body } = await readJson<{ referralId?: string; body?: string }>(req, 2048);
  const r = await q1<{ phone: string | null }>("SELECT phone FROM referrals WHERE id = $1", [String(referralId ?? "")]);
  if (!r?.phone) throw new HttpError(422, "no_phone");
  await audit({ actorId: me.id, actorLabel: me.name, action: "Simulated an inbound text (demo tool)", entity: "referral", entityId: String(referralId) });
  const reply = await handleInbound(r.phone, String(body ?? "").slice(0, 320), "demo_simulator");
  return json({ reply });
});
