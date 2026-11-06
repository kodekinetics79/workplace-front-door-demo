import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { StaffReferralPatch } from "@/lib/validation";
import { q, q1 } from "@/lib/db";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
const LABEL: Record<string, string> = { new: "New", review: "Staff review", contacted: "Contacted", closed: "Closed" };
export const PATCH = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const me = await requirePermission(req, "referrals.write");
  const { id } = await ctx.params;
  const p = StaffReferralPatch.safeParse(await readJson(req, 1024));
  if (!p.success) throw new HttpError(400, "invalid");
  const r = await q1<{ id: string; ref: string; status: string; assigned_to: string | null }>("SELECT id, ref, status, assigned_to FROM referrals WHERE id = $1", [id]);
  if (!r) throw new HttpError(404, "not_found");
  if (p.data.assignedTo) {
    const u = await q1<{ role: string; active: boolean }>("SELECT role, active FROM staff_users WHERE id = $1", [p.data.assignedTo]);
    if (!u || !u.active || !["counselor", "admin"].includes(u.role)) throw new HttpError(400, "invalid_assignee");
  }
  const status = p.data.status ?? r.status; const assigned = p.data.assignedTo === undefined ? r.assigned_to : p.data.assignedTo;
  await q("UPDATE referrals SET status = $2, assigned_to = $3, updated_at = now(), first_action_at = COALESCE(first_action_at, CASE WHEN $2 <> 'new' THEN now() END) WHERE id = $1", [id, status, assigned]);
  if (p.data.status && p.data.status !== r.status) await audit({ actorId: me.id, actorLabel: me.name, action: `Status changed to ${LABEL[status]}`, entity: "referral", entityId: id, detail: { ref: r.ref, from: r.status } });
  if (p.data.assignedTo !== undefined && p.data.assignedTo !== r.assigned_to) await audit({ actorId: me.id, actorLabel: me.name, action: assigned ? "Referral assigned" : "Referral unassigned", entity: "referral", entityId: id, detail: { ref: r.ref, to: assigned } });
  return json({ ok: true });
});
