import { handle, json, assertSameOrigin } from "@/lib/http";
import { clearCookie, staffFromRequest } from "@/lib/auth";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const s = await staffFromRequest(req);
  if (s) await audit({ actorId: s.id, actorLabel: s.name, action: "Signed out", entity: "session" });
  return json({ ok: true }, 200, { "set-cookie": clearCookie() });
});
