import { pseudo } from "./ids";

export class HttpError extends Error { constructor(public status: number, public code: string, message?: string) { super(message ?? code); } }

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

export function clientKey(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
  return pseudo(ip);
}

/** CSRF defence for cookie-authenticated mutations: the request must come from this origin. */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (tests, server-to-server) carry no cookie by default
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  let ok = false;
  try { ok = !!host && new URL(origin).host === host; } catch { ok = false; }
  if (!ok) throw new HttpError(403, "bad_origin", "Cross-origin request blocked");
}

export async function readJson<T = unknown>(req: Request, maxBytes = 16_384): Promise<T> {
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "too_large");
  try { return JSON.parse(text) as T; } catch { throw new HttpError(400, "bad_json"); }
}

export function handle(fn: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return json({ error: e.code, message: e.message }, e.status);
      console.error("[api] unhandled", e);
      return json({ error: "server_error" }, 500);
    }
  };
}
