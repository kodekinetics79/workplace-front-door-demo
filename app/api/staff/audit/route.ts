import { handle, json } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { verifyAuditChain, audit } from "@/lib/audit";
export const runtime = "nodejs";
export const GET = handle(async (req) => {
  const me = await requirePermission(req, "audit.read");
  const result = await verifyAuditChain();
  await audit({ actorId: me.id, actorLabel: me.name, action: `Verified audit log integrity (${result.ok ? "intact" : "BROKEN"})`, entity: "audit" });
  return json(result);
});
