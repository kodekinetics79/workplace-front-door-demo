import { q, q1 } from "./db";
import { newId, refCode } from "./ids";
import { audit } from "./audit";
import { normalizePhone, recordConsent, sendSms } from "./sms";
import { ResidentRequest, EmployerRequest, fieldErrors } from "./validation";
import { HttpError } from "./http";
import { publishedService } from "./services";

export type CreateResult = { ok: true; ref: string; kind: "resident" | "employer"; smsSent: boolean } | { ok: false; errors: Record<string, string> };

async function uniqueRef(prefix: "WP" | "WB") {
  for (let i = 0; i < 6; i++) { const r = refCode(prefix); if (!(await q1("SELECT 1 FROM referrals WHERE ref = $1", [r]))) return r; }
  throw new HttpError(500, "ref_exhausted");
}

export async function createReferral(input: unknown): Promise<CreateResult> {
  const kind = (input as { kind?: string })?.kind;
  if (kind === "employer") {
    const p = EmployerRequest.safeParse(input);
    if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
    if (p.data.website) return { ok: true, ref: "WB-000000", kind: "employer", smsSent: false }; // honeypot: accept silently, store nothing
    const v = p.data; const id = newId(); const ref = await uniqueRef("WB");
    await q(`INSERT INTO referrals (id, ref, kind, first_name, company, phone, email, contact_method, need, openings, note, language) VALUES ($1,$2,'employer',$3,$4,$5,$6,'email',$7,$8,$9,$10)`,
      [id, ref, v.firstName, v.company, normalizePhone(v.phone), v.email.toLowerCase(), v.need, v.openings ?? null, v.note ?? null, v.lang]);
    await audit({ actorId: null, actorLabel: "Public app", action: "Employer inquiry received", entity: "referral", entityId: id, detail: { ref } });
    return { ok: true, ref, kind: "employer", smsSent: false };
  }
  const p = ResidentRequest.safeParse(input);
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  if (p.data.website) return { ok: true, ref: "WP-000000", kind: "resident", smsSent: false };
  const v = p.data;
  const svc = v.serviceId ? await publishedService(v.serviceId, v.lang) : null;
  const phone = v.method === "email" ? normalizePhone(v.phone) : normalizePhone(v.phone)!;
  const consent = !!(v.smsConsent && phone && v.method !== "email");
  const id = newId(); const ref = await uniqueRef("WP");
  await q(`INSERT INTO referrals (id, ref, kind, service_id, first_name, phone, email, contact_method, best_time, note, language, area, sms_consent, interpreter, partner_org, referrer_name, referrer_email, channel) VALUES ($1,$2,'resident',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [id, ref, svc?.id ?? null, v.firstName, phone, v.email?.toLowerCase() ?? null, v.method, v.bestTime, v.note ?? null, v.lang, v.area || null, consent, v.interpreter || null,
     v.partner ? v.partnerOrg ?? null : null, v.partner ? v.referrerName ?? null : null, v.partner ? v.referrerEmail?.toLowerCase() ?? null : null, v.partner ? "partner" : (input as { channel?: string }).channel === "kiosk" ? "kiosk" : "app"]);
  await audit({ actorId: null, actorLabel: v.partner ? `Partner referral (${v.partnerOrg})` : "Public app", action: v.partner ? "Partner referral received" : "Help request received", entity: "referral", entityId: id, detail: { ref, smsConsent: consent, interpreter: v.interpreter || null } });
  let smsSent = false;
  if (consent && phone) {
    await recordConsent(phone, "opt_in", "app_form");
    const body = v.lang === "es"
      ? `The WorkPlace: Gracias ${v.firstName}, recibimos su solicitud ${ref}. Le contactaremos pronto. Responda STOP para cancelar, HELP para ayuda.`
      : `The WorkPlace: Thanks ${v.firstName}, we received request ${ref}. A staff member will contact you. Reply STOP to opt out, HELP for help.`;
    smsSent = (await sendSms({ phone, body, referralId: id, kind: "confirmation" })).ok;
  }
  return { ok: true, ref, kind: "resident", smsSent };
}

const STATUS_ORDER = ["new", "review", "contacted", "closed"] as const;

/** Public status lookup: needs the reference AND a second factor; returns no personal data. */
export async function lookupStatus(refRaw: string, check: string) {
  const ref = refRaw.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^W[PB]-\d{6}$/.test(ref)) return null;
  const r = await q1<{ phone: string | null; email: string | null; status: string; kind: string; service_id: string | null; contact_method: string; language: string; updated_at: string; created_at: string }>(
    "SELECT phone, email, status, kind, service_id, contact_method, language, updated_at, created_at FROM referrals WHERE ref = $1", [ref]);
  if (!r) return null;
  const c = check.trim().toLowerCase();
  const okPhone = !!r.phone && /^\d{4}$/.test(c) && r.phone.endsWith(c);
  const okEmail = !!r.email && c.length >= 3 && /^[a-z0-9._%+-]{3}$/.test(c.slice(0, 3)) && r.email.startsWith(c.slice(0, 3));
  if (!okPhone && !okEmail) return null;
  return { ref, kind: r.kind, status: r.status, step: STATUS_ORDER.indexOf(r.status as (typeof STATUS_ORDER)[number]), serviceId: r.service_id, method: r.contact_method, updatedAt: new Date(r.updated_at).toISOString(), createdAt: new Date(r.created_at).toISOString() };
}
