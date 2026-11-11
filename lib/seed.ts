import bcrypt from "bcryptjs";
import { SERVICE_SEED, WORKPLACE_DRAFT_SEED, CONSENT_TEXT_VERSION } from "./content";
import { appendAuditWith } from "./audit";
import { newId } from "./ids";
import { newTotpSecret } from "./totp";

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;

export const DEMO_ACCOUNTS = [
  { id: "u_counselor", email: "counselor@demo.workplace", name: "Jordan Rivera", role: "counselor", password: "Counselor-Demo-2026" },
  { id: "u_counselor2", email: "okafor@demo.workplace", name: "Ada Okafor", role: "counselor", password: "Counselor-Demo-2026" },
  { id: "u_publisher", email: "publisher@demo.workplace", name: "Priya Santos", role: "publisher", password: "Publisher-Demo-2026" },
  { id: "u_admin", email: "admin@demo.workplace", name: "Dana Morgan", role: "admin", password: "Admin-Demo-2026" },
] as const;

const ago = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

/**
 * Tops up The WorkPlace's published program catalogue on an already-seeded database,
 * so a redeploy picks up catalogue changes without wiping demo data. Only inserts
 * records that are absent; never overwrites staff edits to an existing draft.
 */
export async function syncPublishedCatalogue(query: Query) {
  for (const s of WORKPLACE_DRAFT_SEED) {
    await query("INSERT INTO services (id, goals, formats, towns, state, live, draft, updated_by) VALUES ($1,$2,$3,$4,$5,NULL,$6::jsonb,$7) ON CONFLICT (id) DO NOTHING",
      [s.id, s.goals, s.formats, s.towns, s.state, JSON.stringify(s.doc), "u_publisher"]);
  }
}

export async function seed(query: Query) {
  for (const a of DEMO_ACCOUNTS) {
    await query("INSERT INTO staff_users (id, email, name, role, password_hash, mfa_secret) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING",
      [a.id, a.email, a.name, a.role, await bcrypt.hash(a.password, 10), newTotpSecret()]);
  }
  await query("INSERT INTO staff_users (id, email, name, role, password_hash, active) VALUES ('u_system','system@demo.workplace','System','admin',$1,FALSE) ON CONFLICT (id) DO NOTHING", [await bcrypt.hash(newId() + newId(), 10)]);
  for (const s of [...SERVICE_SEED, ...WORKPLACE_DRAFT_SEED]) {
    const live = s.state === "published" ? JSON.stringify(s.doc) : null;
    await query("INSERT INTO services (id, goals, formats, towns, state, live, draft, updated_by) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8) ON CONFLICT (id) DO NOTHING",
      [s.id, s.goals, s.formats, s.towns, s.state, live, JSON.stringify(s.doc), "u_publisher"]);
  }
  const refs = [
    { id: newId(), ref: "WP-482913", kind: "resident", svc: "coach", name: "Maria", phone: "+12035550148", email: null, method: "callback", time: "am", lang: "en", area: "bridgeport", status: "new", assigned: null, consent: true, note: "Looking for full-time work after a layoff.", at: ago(38) },
    { id: newId(), ref: "WP-517204", kind: "resident", svc: "training", name: "James", phone: null, email: "james@example.org", method: "email", time: "any", lang: "en", area: "stamford", status: "review", assigned: "u_counselor", consent: false, note: "Interested in IT support certificates.", at: ago(190) },
    { id: newId(), ref: "WP-530871", kind: "resident", svc: "youth", name: "Ana", phone: "+12035550172", email: null, method: "text", time: "pm", lang: "es", area: "valley", status: "new", assigned: null, consent: true, note: "Busca su primer empleo después de la escuela.", at: ago(1260) },
    { id: newId(), ref: "WP-541129", kind: "resident", svc: "resume", name: "Devon", phone: "+12035550190", email: null, method: "text", time: "any", lang: "en", area: "bridgeport", status: "contacted", assigned: "u_counselor2", consent: false, note: "Prefers evening workshops.", at: ago(3000) },
    { id: newId(), ref: "WP-552380", kind: "resident", svc: "digital", name: "Li", phone: null, email: "li@example.org", method: "email", time: "any", lang: "en", area: "online", status: "closed", assigned: "u_counselor2", consent: false, note: "Enrolled in online class.", at: ago(5000) },
    { id: newId(), ref: "WP-566402", kind: "resident", svc: "reentry_none", name: "Marcus", phone: "+12035550156", email: null, method: "callback", time: "pm", lang: "en", area: "bridgeport", status: "new", assigned: null, consent: false, note: "Referred by community reentry partner. Interested in warehouse work.", at: ago(95) },
    { id: newId(), ref: "WB-603318", kind: "employer", svc: null, name: "Sam", phone: null, email: "hr@harborlogistics.example", method: "email", time: "any", lang: "en", area: "bridgeport", status: "new", assigned: null, consent: false, note: "Hiring 12 warehouse associates before the holidays.", at: ago(420) },
  ];
  for (const r of refs) {
    if (r.svc === "reentry_none") r.svc = null as unknown as string;
    await query(`INSERT INTO referrals (id, ref, kind, service_id, first_name, company, phone, email, contact_method, best_time, note, need, openings, language, area, status, assigned_to, sms_consent, created_at, updated_at, first_action_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$19,$20)`,
      [r.id, r.ref, r.kind, r.svc, r.name, r.kind === "employer" ? "Harbor Logistics (sample)" : null, r.phone, r.email, r.method, r.time, r.note, r.kind === "employer" ? "recruit" : null, r.kind === "employer" ? 12 : null, r.lang, r.area, r.status, r.assigned, r.consent, r.at, r.status === "new" ? null : new Date(new Date(r.at).getTime() + 47 * 60000).toISOString()]);
    if (r.phone && r.consent) {
      await query("INSERT INTO sms_consent (phone, status, updated_at) VALUES ($1,'opted_in',$2) ON CONFLICT (phone) DO NOTHING", [r.phone, r.at]);
      await query("INSERT INTO consent_events (id, phone, event, text_version, source, created_at) VALUES ($1,$2,'opt_in',$3,'app_form',$4)", [newId(), r.phone, CONSENT_TEXT_VERSION, r.at]);
      const body = r.lang === "es" ? `The WorkPlace: Gracias ${r.name}, recibimos su solicitud ${r.ref}. Le contactaremos pronto. Responda STOP para cancelar, HELP para ayuda.` : `The WorkPlace: Thanks ${r.name}, we received request ${r.ref}. A staff member will contact you. Reply STOP to opt out, HELP for help.`;
      await query("INSERT INTO sms_messages (id, referral_id, phone, direction, body, kind, status, created_at) VALUES ($1,$2,$3,'out',$4,'confirmation','simulated',$5)", [newId(), r.id, r.phone, body, r.at]);
    }
    if (r.ref === "WP-566402") await query("UPDATE referrals SET partner_org = $2, referrer_name = $3, referrer_email = $4, channel = 'partner' WHERE id = $1", [r.id, "Bridgeport Reentry Collaborative (sample)", "L. Grant", "lgrant@partner.example"]);
    if (r.ref === "WP-530871") await query("UPDATE referrals SET interpreter = 'es' WHERE id = $1", [r.id]);
    if (r.ref === "WP-530871") await query("INSERT INTO sms_messages (id, referral_id, phone, direction, body, status, created_at) VALUES ($1,$2,$3,'in',$4,'received',$5)", [newId(), r.id, r.phone, "Gracias! Puedo hablar despues de las 3", ago(1250)]);
    if (r.ref === "WP-541129") {
      await query("INSERT INTO sms_consent (phone, status, updated_at) VALUES ($1,'opted_out',$2) ON CONFLICT (phone) DO NOTHING", [r.phone, ago(2900)]);
      await query("INSERT INTO consent_events (id, phone, event, text_version, source, created_at) VALUES ($1,$2,'opt_in',$3,'app_form',$4),($5,$2,'opt_out',NULL,'sms_keyword',$6)", [newId(), r.phone, CONSENT_TEXT_VERSION, r.at, newId(), ago(2900)]);
      await query("INSERT INTO sms_messages (id, referral_id, phone, direction, body, status, created_at) VALUES ($1,$2,$3,'in','STOP','received',$4)", [newId(), r.id, r.phone, ago(2901)]);
      await query("INSERT INTO sms_messages (id, referral_id, phone, direction, body, kind, status, created_at) VALUES ($1,$2,$3,'out',$4,'opt_out_confirmation','simulated',$5)", [newId(), r.id, r.phone, "The WorkPlace: You are unsubscribed and will receive no more messages. Reply START to resubscribe.", ago(2900)]);
      await query("INSERT INTO referral_notes (id, referral_id, author_id, body, created_at) VALUES ($1,$2,'u_counselor2',$3,$4)", [newId(), r.id, "Opted out of texts. Following up by phone.", ago(2800)]);
    }
  }
  // Pseudonymous analytics history so reports have shape on first load (sample data).
  const names: [string, number][] = [["session_start", 2140], ["service_view", 1385], ["request_start", 312], ["request_submit", 241]];
  for (const [name, n] of names) {
    await query(`INSERT INTO analytics_events (name, lang, props, visitor, created_at)
      SELECT $1, CASE WHEN ($1 = 'request_submit' AND g % 6 = 0) OR ($1 <> 'request_submit' AND g % 4 = 0) THEN 'es' ELSE 'en' END, '{"sample":true}'::jsonb, 'seed' || (g % 900), now() - ((g % 30) || ' days')::interval
      FROM generate_series(1, $2::int) g`, [name, n]);
  }
  await appendAuditWith(query, { actorId: null, actorLabel: "System", action: "Demo environment initialized with sample data", entity: "system" });
  await query("INSERT INTO app_meta (key, value) VALUES ('seeded', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [new Date().toISOString()]);
}
