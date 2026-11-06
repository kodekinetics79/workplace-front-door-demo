import { handle, json } from "@/lib/http";
import { publishedServices } from "@/lib/services";
export const runtime = "nodejs";
export const GET = handle(async (req) => {
  const u = new URL(req.url);
  const lang = u.searchParams.get("lang") === "es" ? "es" : "en";
  const ids = (u.searchParams.get("ids") ?? "").split(",").filter((x) => /^[a-z0-9-]{1,40}$/.test(x)).slice(0, 50);
  const all = await publishedServices(lang);
  return json({ services: ids.length ? all.filter((s) => ids.includes(s.id)) : all });
});
