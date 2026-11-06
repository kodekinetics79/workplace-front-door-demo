import { q1 } from "./db";
import { HttpError } from "./http";

/** Fixed-window limiter stored in Postgres, so it holds across serverless instances. */
export async function rateLimit(key: string, limit: number, windowSec: number) {
  const row = await q1<{ count: number }>(
    `INSERT INTO rate_limits (key, window_start, count) VALUES ($1, now(), 1)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => $2) THEN now() ELSE rate_limits.window_start END
     RETURNING count`, [key, windowSec]);
  if ((row?.count ?? 0) > limit) throw new HttpError(429, "rate_limited", "Too many requests");
}
