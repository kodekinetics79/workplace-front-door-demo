import { handleInbound, validTwilioSignature, twilioConfigured } from "@/lib/sms";
import { clientKey } from "@/lib/http";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Twilio inbound webhook. Replies are sent through the API (so they are logged), so the TwiML response is empty.
export async function POST(req: Request) {
  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });
  if (twilioConfigured()) {
    const proto = req.headers.get("x-forwarded-proto") ?? "https"; const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const url = `${proto}://${host}${new URL(req.url).pathname}`;
    if (!validTwilioSignature(url, params, req.headers.get("x-twilio-signature"))) return new Response("Forbidden", { status: 403 });
  } else {
    return new Response("Messaging provider not configured", { status: 503 });
  }
  try { await rateLimit(`sms:${clientKey(req)}`, 300, 60); } catch { return new Response("Too many requests", { status: 429 }); }
  await handleInbound(params.From ?? "", params.Body ?? "", "sms_keyword");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, { headers: { "content-type": "text/xml" } });
}
