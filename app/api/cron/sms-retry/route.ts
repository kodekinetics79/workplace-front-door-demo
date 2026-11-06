import { cronAuthorized } from "@/lib/cron";
import { retryFailed } from "@/lib/sms";
export const runtime = "nodejs";
export async function GET(req: Request) { if (!cronAuthorized(req)) return new Response("Unauthorized", { status: 401 }); return Response.json(await retryFailed()); }
