import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { q, q1 } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { ServiceRow } from "@/lib/services";
export const runtime = "nodejs";
const complete = (d: ServiceRow["draft"]) => (["en", "es"] as const).every((l) => d[l] && ["title", "sum", "who", "how", "bring"].every((k) => String((d[l] as Record<string, string>)[k] ?? "").trim().length > 0));

export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const { id } = await ctx.params;
  const { action } = await readJson<{ action?: string }>(req, 256);
  const s = await q1<ServiceRow>("SELECT * FROM services WHERE id = $1", [id]);
  if (!s) throw new HttpError(404, "not_found");
  if (action === "submit") {
    const me = await requirePermission(req, "content.edit");
    if (s.state !== "draft") throw new HttpError(409, "not_draft");
    if (!complete(s.draft)) throw new HttpError(422, "incomplete", "Add every English and Spanish field before submitting. Cards cannot go live in one language only.");
    await q("UPDATE services SET state = 'review', submitted_by = $2, updated_at = now() WHERE id = $1", [id, me.id]);
    await audit({ actorId: me.id, actorLabel: me.name, action: "Submitted card for review", entity: "service", entityId: id });
    return json({ state: "review" });
  }
  if (action === "approve") {
    const me = await requirePermission(req, "content.approve");
    if (s.state !== "review") throw new HttpError(409, "not_in_review");
    if (s.submitted_by === me.id) throw new HttpError(403, "two_person_rule", "Two-person rule: the person who submitted a card cannot approve it.");
    await q("UPDATE services SET state = 'published', live = draft, version = version + 1, updated_by = $2, updated_at = now() WHERE id = $1", [id, me.id]);
    await audit({ actorId: me.id, actorLabel: me.name, action: "Approved and published card", entity: "service", entityId: id, detail: { version: s.version + 1 } });
    return json({ state: "published" });
  }
  if (action === "return") {
    const me = await requirePermission(req, "content.approve");
    if (s.state !== "review") throw new HttpError(409, "not_in_review");
    await q("UPDATE services SET state = 'draft', updated_at = now() WHERE id = $1", [id]);
    await audit({ actorId: me.id, actorLabel: me.name, action: "Returned card to draft", entity: "service", entityId: id });
    return json({ state: "draft" });
  }
  if (action === "unpublish") {
    const me = await requirePermission(req, "content.approve");
    await q("UPDATE services SET live = NULL, state = 'draft', updated_at = now() WHERE id = $1", [id]);
    await audit({ actorId: me.id, actorLabel: me.name, action: "Unpublished card", entity: "service", entityId: id });
    return json({ state: "draft" });
  }
  throw new HttpError(400, "unknown_action");
});
