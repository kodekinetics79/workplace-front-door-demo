import { q1, isEphemeralDb } from "@/lib/db";
import { twilioConfigured } from "@/lib/sms";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const t0 = Date.now(); let db = "ok";
  try { await q1("SELECT 1"); } catch { db = "error"; }
  return Response.json({ status: db === "ok" ? "ok" : "degraded", db, dbMode: isEphemeralDb() ? "ephemeral" : "neon", sms: twilioConfigured() ? "twilio" : "simulated", latencyMs: Date.now() - t0 }, { status: db === "ok" ? 200 : 503, headers: { "cache-control": "no-store" } });
}
