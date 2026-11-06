import { timingSafeEqual } from "crypto";
/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". Anything else is rejected. */
export function cronAuthorized(req: Request) {
  const s = process.env.CRON_SECRET; const h = req.headers.get("authorization") ?? "";
  if (!s) return false;
  const a = Buffer.from(h); const b = Buffer.from(`Bearer ${s}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
