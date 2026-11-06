import { applyStatus, validTwilioSignature, twilioConfigured } from "@/lib/sms";
export const runtime = "nodejs";
// Twilio delivery-status webhook (signature-verified).
export async function POST(req: Request) {
  if (!twilioConfigured()) return new Response("Messaging provider not configured", { status: 503 });
  const form = await req.formData(); const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });
  const proto = req.headers.get("x-forwarded-proto") ?? "https"; const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!validTwilioSignature(`${proto}://${host}${new URL(req.url).pathname}`, params, req.headers.get("x-twilio-signature"))) return new Response("Forbidden", { status: 403 });
  if (params.MessageSid && params.MessageStatus) await applyStatus(params.MessageSid, params.MessageStatus);
  return new Response(null, { status: 204 });
}
