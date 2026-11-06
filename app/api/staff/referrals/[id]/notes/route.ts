import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { newId } from "@/lib/ids";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const me = await requirePermission(req, "referrals.write");
  const { id } = await ctx.params;
  const { body } = await readJson<{ body?: string }>(req, 4096);
  const text = String(body ?? "").trim().slice(0, 2000);
  if (!text) throw new HttpError(400, "empty");
  if (!(await q1("SELECT 1 FROM referrals WHERE id = $1", [id]))) throw new HttpError(404, "not_found");
  await q("INSERT INTO referral_notes (id, referral_id, author_id, body) VALUES ($1,$2,$3,$4)", [newId(), id, me.id, text]);
  await q("UPDATE referrals SET updated_at = now(), first_action_at = COALESCE(first_action_at, now()) WHERE id = $1", [id]);
  await audit({ actorId: me.id, actorLabel: me.name, action: "Added case note", entity: "referral", entityId: id });
  return json({ ok: true }, 201);
});
