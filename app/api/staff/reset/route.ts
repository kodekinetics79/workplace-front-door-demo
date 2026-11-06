import { handle, json, assertSameOrigin } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { resetDemoData } from "@/lib/db";
export const runtime = "nodejs";
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  await requirePermission(req, "demo.reset");
  await resetDemoData();
  return json({ ok: true }, 200, { "set-cookie": "wp_staff=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" });
});
