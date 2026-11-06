import { handle, json, readJson, assertSameOrigin, HttpError } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { ServiceDraftSchema } from "@/lib/validation";
import { q, q1 } from "@/lib/db";
import { audit } from "@/lib/audit";
import type { ServiceRow } from "@/lib/services";
export const runtime = "nodejs";
// Saving never changes what the public sees: edits go to the draft; the live version changes only on approval.
export const PUT = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const me = await requirePermission(req, "content.edit");
  const { id } = await ctx.params;
  const s = await q1<ServiceRow>("SELECT * FROM services WHERE id = $1", [id]);
  if (!s) throw new HttpError(404, "not_found");
  if (s.state === "review") throw new HttpError(409, "in_review", "This card is waiting for approval. Ask an administrator to return it before editing.");
  const p = ServiceDraftSchema.safeParse(await readJson(req, 16_384));
  if (!p.success) throw new HttpError(400, "invalid");
  await q("UPDATE services SET draft = $2::jsonb, state = 'draft', updated_by = $3, updated_at = now() WHERE id = $1", [id, JSON.stringify(p.data), me.id]);
  await audit({ actorId: me.id, actorLabel: me.name, action: "Saved draft", entity: "service", entityId: id });
  return json({ ok: true });
});
