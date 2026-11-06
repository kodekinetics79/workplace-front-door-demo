import { handle, json, readJson, clientKey } from "@/lib/http";
import { ALLOWED_EVENTS, track, type EventName } from "@/lib/analytics";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const POST = handle(async (req) => {
  const key = clientKey(req);
  await rateLimit(`ev:${key}`, 120, 600);
  const { name, lang, props } = await readJson<{ name?: string; lang?: string; props?: Record<string, unknown> }>(req, 2048);
  if (!ALLOWED_EVENTS.includes(name as EventName)) return json({ error: "unknown_event" }, 400);
  const safe: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(props ?? {}).slice(0, 6)) if (/^[a-z_]{1,20}$/.test(k) && ["string", "number", "boolean"].includes(typeof v)) safe[k] = typeof v === "string" ? v.slice(0, 40) : (v as number | boolean);
  await track(name as EventName, String(lang ?? "en"), key, safe);
  return new Response(null, { status: 204 });
});
