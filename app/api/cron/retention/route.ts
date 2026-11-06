import { cronAuthorized } from "@/lib/cron";
import { applyRetention } from "@/lib/retention";
export const runtime = "nodejs";
export async function GET(req: Request) { if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 }); return Response.json(await applyRetention()); }
