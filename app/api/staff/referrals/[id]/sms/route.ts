import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { rateLimit } from "@/lib/ratelimit";
export const runtime = "nodejs";
// Blocks obvious sensitive data from ever going out by text (SSN-like and card-like numbers).
const SENSITIVE = /\b\d{3}-?\d{2}-?\d{4}\b|\b(?:\d[ -]?){13,16}\b/;
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const me = await requirePermission(req, "sms.send");
  await rateLimit(`smsout:${me.id}`, 60, 3600);
  const { id } = await ctx.params;
  const { body } = await readJson<{ body?: string }>(req, 4096);
  const text = String(body ?? "").trim().slice(0, 640);
  if (!text) throw new HttpError(400, "empty");
  if (SENSITIVE.test(text)) throw new HttpError(422, "sensitive_content", "This message looks like it contains an ID or account number. Remove it and send the details by phone.");
  const r = await q1<{ phone: string | null; status: string }>("SELECT phone, status FROM referrals WHERE id = $1", [id]);
  if (!r) throw new HttpError(404, "not_found");
  if (!r.phone) throw new HttpError(422, "no_phone", "No phone number on this referral.");
  const out = await sendSms({ phone: r.phone, body: text, referralId: id, sentBy: me.id, actorLabel: me.name });
  if (!out.ok && "reason" in out) throw new HttpError(422, "no_consent", "This person has not opted in to texts, or replied STOP. Contact them another way.");
  if (r.status === "new" || r.status === "review") await q("UPDATE referrals SET status = 'contacted', updated_at = now(), first_action_at = COALESCE(first_action_at, now()) WHERE id = $1", [id]);
  return json(out, 201);
});
