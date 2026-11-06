import { createHmac, timingSafeEqual } from "crypto";
import { q, q1 } from "./db";
import { newId } from "./ids";
import { audit } from "./audit";
import { CONSENT_TEXT_VERSION } from "./content";

export const STOP_WORDS = ["STOP", "STOPALL", "UNSUBSCRIBE", "CANCEL", "END", "QUIT", "REVOKE", "OPTOUT", "PARAR", "ALTO"];
export const START_WORDS = ["START", "UNSTOP", "YES", "SUBSCRIBE", "INICIAR"];
export const HELP_WORDS = ["HELP", "INFO", "AYUDA"];

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (d.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(d)) return `+1${d}`;
  if (d.length === 11 && d[0] === "1" && /^[2-9]\d{2}[2-9]\d{6}$/.test(d.slice(1))) return `+${d}`;
  return null;
}
export const maskPhone = (p: string | null) => (p ? `(•••) •••-${p.slice(-4)}` : "");

/** GSM-7 vs UCS-2 segment count, so staff see the cost of what they send. */
export function segmentCount(text: string): { segments: number; unicode: boolean } {
  const gsm = /^[\n\r A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~\]|€]*$/.test(text);
  const n = [...text].length;
  if (!n) return { segments: 0, unicode: !gsm };
  return gsm ? { segments: n <= 160 ? 1 : Math.ceil(n / 153), unicode: false } : { segments: n <= 70 ? 1 : Math.ceil(n / 67), unicode: true };
}

export const twilioConfigured = () => !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID));

export async function consentStatus(phone: string): Promise<"opted_in" | "opted_out" | "none"> {
  const r = await q1<{ status: "opted_in" | "opted_out" }>("SELECT status FROM sms_consent WHERE phone = $1", [phone]);
  return r?.status ?? "none";
}

export async function recordConsent(phone: string, event: "opt_in" | "opt_out" | "resubscribe", source: string) {
  const status = event === "opt_out" ? "opted_out" : "opted_in";
  await q("INSERT INTO sms_consent (phone, status, updated_at) VALUES ($1,$2,now()) ON CONFLICT (phone) DO UPDATE SET status = EXCLUDED.status, updated_at = now()", [phone, status]);
  await q("INSERT INTO consent_events (id, phone, event, text_version, source) VALUES ($1,$2,$3,$4,$5)", [newId(), phone, event, event === "opt_out" ? null : CONSENT_TEXT_VERSION, source]);
}

async function deliver(to: string, body: string): Promise<{ status: string; sid: string | null }> {
  if (!twilioConfigured()) return { status: "simulated", sid: null };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const form = new URLSearchParams({ To: to, Body: body });
  if (process.env.PUBLIC_BASE_URL) form.set("StatusCallback", `${process.env.PUBLIC_BASE_URL.replace(/\/$/, "")}/api/sms/status`);
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID); else form.set("From", process.env.TWILIO_FROM_NUMBER!);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = (await res.json().catch(() => ({}))) as { sid?: string; status?: string; message?: string };
  if (!res.ok) return { status: `failed: ${data.message ?? res.status}`.slice(0, 120), sid: null };
  return { status: data.status ?? "queued", sid: data.sid ?? null };
}

/**
 * Sends one SMS. Consent is enforced here, in one place, so no caller can bypass it.
 * kind "opt_out_confirmation" is the single message allowed after STOP (carrier requirement).
 */
export async function sendSms(opts: { phone: string; body: string; referralId?: string | null; kind?: string; sentBy?: string | null; actorLabel?: string }) {
  const kind = opts.kind ?? "message";
  const exempt = kind === "opt_out_confirmation" || kind === "help_reply";
  if (!exempt && (await consentStatus(opts.phone)) !== "opted_in") return { ok: false as const, reason: "no_consent" };
  // SMS-pumping protection: one automated confirmation per number per day, and a global daily ceiling.
  if (kind === "confirmation") {
    const recent = await q1<{ n: number }>("SELECT count(*)::int n FROM sms_messages WHERE phone = $1 AND kind = 'confirmation' AND created_at > now() - interval '24 hours'", [opts.phone]);
    if ((recent?.n ?? 0) >= 1) return { ok: false as const, reason: "throttled" };
  }
  const today = await q1<{ n: number }>("SELECT count(*)::int n FROM sms_messages WHERE direction = 'out' AND created_at > now() - interval '24 hours'");
  if ((today?.n ?? 0) >= Number(process.env.SMS_DAILY_CAP || 500)) {
    await audit({ actorId: null, actorLabel: "System", action: "SMS daily cap reached; message held", entity: "sms" });
    return { ok: false as const, reason: "daily_cap" };
  }
  const { segments } = segmentCount(opts.body);
  const r = await deliver(opts.phone, opts.body);
  const id = newId();
  await q("INSERT INTO sms_messages (id, referral_id, phone, direction, body, kind, status, segments, provider_sid, sent_by) VALUES ($1,$2,$3,'out',$4,$5,$6,$7,$8,$9)",
    [id, opts.referralId ?? null, opts.phone, opts.body, kind, r.status, segments, r.sid, opts.sentBy ?? null]);
  if (opts.sentBy) await audit({ actorId: opts.sentBy, actorLabel: opts.actorLabel ?? "Staff", action: `Sent SMS (${segments} segment${segments === 1 ? "" : "s"})`, entity: "referral", entityId: opts.referralId ?? null, detail: { status: r.status } });
  return { ok: !r.status.startsWith("failed"), id, status: r.status, segments };
}

/** Handles an inbound text (Twilio webhook or the console's demo simulator). Returns the auto-reply, if any. */
export async function handleInbound(fromRaw: string, bodyRaw: string, source: string, messageSid?: string): Promise<string | null> {
  const phone = normalizePhone(fromRaw) ?? fromRaw;
  // Idempotency: Twilio may retry a webhook; the same MessageSid is processed once.
  if (messageSid && (await q1("SELECT 1 FROM sms_messages WHERE provider_sid = $1", [messageSid]))) return null;
  const body = (bodyRaw || "").trim().slice(0, 1600);
  const ref = await q1<{ id: string; language: string; status: string }>("SELECT id, language, status FROM referrals WHERE phone = $1 ORDER BY created_at DESC LIMIT 1", [phone]);
  await q("INSERT INTO sms_messages (id, referral_id, phone, direction, body, status, provider_sid) VALUES ($1,$2,$3,'in',$4,'received',$5) ON CONFLICT DO NOTHING", [newId(), ref?.id ?? null, phone, body, messageSid ?? null]);
  const word = body.toUpperCase().replace(/[^A-Z]/g, "");
  const es = ref?.language === "es";
  let reply: string | null = null; let kind = "message";
  if (STOP_WORDS.includes(word)) {
    await recordConsent(phone, "opt_out", source);
    await audit({ actorId: null, actorLabel: "System", action: "STOP received; SMS suppressed", entity: "consent", entityId: ref?.id ?? null });
    reply = es ? "The WorkPlace: Canceló los mensajes y no recibirá más. Responda START para volver a suscribirse." : "The WorkPlace: You are unsubscribed and will receive no more messages. Reply START to resubscribe.";
    kind = "opt_out_confirmation";
  } else if (START_WORDS.includes(word)) {
    await recordConsent(phone, "resubscribe", source);
    await audit({ actorId: null, actorLabel: "System", action: "START received; SMS resubscribed", entity: "consent", entityId: ref?.id ?? null });
    reply = es ? "The WorkPlace: Volvió a suscribirse. Responda STOP para cancelar, HELP para ayuda." : "The WorkPlace: You are resubscribed. Reply STOP to opt out, HELP for help.";
  } else if (HELP_WORDS.includes(word)) {
    reply = es ? "The WorkPlace: Ayuda con su solicitud. Llámenos en horario laboral. Responda STOP para cancelar. Pueden aplicarse tarifas." : "The WorkPlace: Help with your request. Call us during business hours. Reply STOP to opt out. Msg and data rates may apply.";
    kind = "help_reply";
  } else if (ref && (word === "C" || word === "R")) {
    await q("INSERT INTO referral_notes (id, referral_id, author_id, body) SELECT $1, $2, 'u_system', $3", [newId(), ref.id, word === "C" ? "Person confirmed the scheduled contact by text (C)." : "Person asked to reschedule by text (R)."]);
    reply = word === "C" ? (es ? "The WorkPlace: Gracias, quedó confirmado." : "The WorkPlace: Thanks, you are confirmed.") : (es ? "The WorkPlace: Entendido. El personal le propondrá otro horario." : "The WorkPlace: Got it. Staff will offer another time.");
  }
  if (reply) await sendSms({ phone, body: reply, referralId: ref?.id ?? null, kind });
  return reply;
}

/** Twilio request signature check (X-Twilio-Signature, HMAC-SHA1 over URL + sorted params). */
export function validTwilioSignature(url: string, params: Record<string, string>, signature: string | null, token = process.env.TWILIO_AUTH_TOKEN) {
  if (!token || !signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Delivery status from the provider (queued → sent → delivered | failed | undelivered). */
export async function applyStatus(sid: string, status: string) {
  const allowed = ["queued", "sending", "sent", "delivered", "undelivered", "failed", "read"];
  if (!allowed.includes(status)) return false;
  const r = await q("UPDATE sms_messages SET status = $2 WHERE provider_sid = $1 AND direction = 'out' RETURNING id", [sid, status]);
  return r.length > 0;
}

/** Retries failed outbound messages up to 3 attempts, re-checking consent each time (scheduled job). */
export async function retryFailed() {
  const rows = await q<{ id: string; phone: string; body: string; kind: string; attempts: number }>(
    "SELECT id, phone, body, kind, attempts FROM sms_messages WHERE direction = 'out' AND status LIKE 'failed%' AND attempts < 3 AND created_at > now() - interval '24 hours' ORDER BY created_at LIMIT 50");
  let sent = 0;
  for (const m of rows) {
    const exempt = m.kind === "opt_out_confirmation" || m.kind === "help_reply";
    if (!exempt && (await consentStatus(m.phone)) !== "opted_in") { await q("UPDATE sms_messages SET status = 'cancelled: no consent' WHERE id = $1", [m.id]); continue; }
    const r = await deliver(m.phone, m.body);
    await q("UPDATE sms_messages SET status = $2, provider_sid = COALESCE($3, provider_sid), attempts = attempts + 1 WHERE id = $1", [m.id, r.status, r.sid]);
    if (!r.status.startsWith("failed")) sent++;
  }
  return { checked: rows.length, sent };
}
