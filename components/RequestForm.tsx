"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./Icon";
import { ping, holdOffline, isKiosk } from "./client";
import type { Dict } from "@/lib/i18n";

type Errors = Record<string, string>;

export function RequestForm({ t, lang, serviceId, serviceTitle }: { t: Dict; lang: "en" | "es"; serviceId?: string; serviceTitle: string }) {
  const router = useRouter();
  const [method, setMethod] = useState<"callback" | "email" | "text">("callback");
  const [phone, setPhone] = useState("");
  const [sms, setSms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [partner, setPartner] = useState(false);
  const [held, setHeld] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  useEffect(() => { ping("request_start", { service: serviceId ?? "general" }); }, [serviceId]);
  const digits = phone.replace(/\D/g, "");
  const showSms = method !== "email" && digits.length >= 10;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const body = {
      kind: "resident", serviceId, lang, method,
      firstName: String(f.get("firstName") ?? ""), phone: method === "email" ? String(f.get("phone2") ?? "") || undefined : phone,
      email: method === "email" ? String(f.get("email") ?? "") : undefined, bestTime: String(f.get("bestTime") ?? "any"),
      area: String(f.get("area") ?? ""), note: String(f.get("note") ?? ""), smsConsent: showSms && sms, website: String(f.get("website") ?? ""),
      interpreter: String(f.get("interpreter") ?? ""), partner, partnerOrg: String(f.get("partnerOrg") ?? ""), referrerName: String(f.get("referrerName") ?? ""),
      referrerEmail: String(f.get("referrerEmail") ?? ""), partnerConsent: f.get("partnerConsent") === "on", channel: isKiosk() ? "kiosk" : "app",
    };
    if (typeof navigator !== "undefined" && !navigator.onLine) { holdOffline(body); setHeld(true); return; }
    setBusy(true); setFormError(null);
    try {
      const res = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422) { setErrors(data.errors ?? {}); setTimeout(() => alertRef.current?.focus(), 0); return; }
      if (res.status === 429) { setFormError(t.e_rate); setTimeout(() => alertRef.current?.focus(), 0); return; }
      if (!res.ok) { setFormError(t.e_generic); setTimeout(() => alertRef.current?.focus(), 0); return; }
      try { localStorage.setItem("wp_last_ref", data.ref); } catch {}
      router.push(`/done?ref=${encodeURIComponent(data.ref)}&m=${method}&sms=${data.smsSent ? 1 : 0}${serviceId ? `&service=${serviceId}` : ""}`);
    } catch { holdOffline(body); setHeld(true); } finally { setBusy(false); }
  }
  if (held) return (<div className="section"><div role="status" className="card pad"><Icon name="info" size={22} /><p style={{ fontWeight: 700 }}>{t.offline_held}</p><Link href="/" className="btn btn-secondary btn-sm">{t.back_discover}</Link></div></div>);
  const err = (k: string) => (errors[k] ? (t as Record<string, string>)[errors[k]] ?? t.e_req : null);
  const hasErr = Object.keys(errors).length > 0;

  return (
    <form onSubmit={submit} noValidate className="section" style={{ gap: 18 }}>
      <div className="note"><Icon name="bookmark" size={18} /><span><span style={{ color: "var(--ink-2)" }}>{t.r_about} </span><strong>{serviceTitle}</strong></span></div>
      {(hasErr || formError) && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="alert"><Icon name="alert" size={20} /><span>{formError ?? t.r_fix}</span></div>
      )}
      <div className="field">
        <label htmlFor="firstName">{t.r_name}</label>
        <input id="firstName" name="firstName" autoComplete="given-name" className="input" aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "firstName-e" : undefined} maxLength={60} required />
        {err("firstName") && <span id="firstName-e" className="err">{err("firstName")}</span>}
      </div>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend className="legend" style={{ marginBottom: 8 }}>{t.r_method}</legend>
        <div className="seg">
          {(["callback", "email", "text"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)}>{t[`m_${m}`]}</button>
          ))}
        </div>
      </fieldset>
      {method !== "email" ? (
        <div className="field">
          <label htmlFor="phone">{method === "text" ? t.r_phone_text : t.r_phone_callback}</label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(203) 555-0100" className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
            aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-e" : undefined} maxLength={20} />
          {err("phone") && <span id="phone-e" className="err">{err("phone")}</span>}
        </div>
      ) : (
        <div className="field">
          <label htmlFor="email">{t.r_email}</label>
          <input id="email" name="email" type="email" autoComplete="email" className="input" aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-e" : undefined} maxLength={120} />
          {err("email") && <span id="email-e" className="err">{err("email")}</span>}
        </div>
      )}
      <div className="field">
        <label htmlFor="bestTime">{t.r_time}</label>
        <select id="bestTime" name="bestTime" className="select" defaultValue="any">
          <option value="any">{t.t_any}</option><option value="am">{t.t_am}</option><option value="pm">{t.t_pm}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="area">{t.r_area}</label>
        <select id="area" name="area" className="select" defaultValue="">
          <option value="">—</option><option value="bridgeport">Bridgeport</option><option value="stamford">Stamford</option>
          <option value="valley">{lang === "es" ? "Valle del Bajo Naugatuck" : "Lower Naugatuck Valley"}</option><option value="online">{lang === "es" ? "En línea" : "Online"}</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="note">{t.r_note}</label>
        <textarea id="note" name="note" className="textarea" rows={3} maxLength={600} aria-describedby="note-h" />
        <span id="note-h" className="small">{t.r_note_hint}</span>
      </div>
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {showSms && (
        <div className="check">
          <input id="sms" type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />
          <label htmlFor="sms" style={{ display: "flex", flexDirection: "column", gap: 4, cursor: "pointer" }}>
            <span style={{ fontWeight: 700 }}>{t.sms_h}</span><span style={{ fontSize: ".8125rem", color: "var(--ink-2)", lineHeight: 1.45 }}>{t.sms_p}</span>
          </label>
        </div>
      )}
      <div className="field">
        <label htmlFor="interpreter">{t.r_interp}</label>
        <select id="interpreter" name="interpreter" className="select" defaultValue="">
          <option value="">{t.i_none}</option><option value="es">{t.i_es}</option><option value="pt">{t.i_pt}</option><option value="ht">{t.i_ht}</option>
          <option value="pl">{t.i_pl}</option><option value="asl">{t.i_asl}</option><option value="other">{t.i_other}</option>
        </select>
      </div>
      <div className="check">
        <input id="partner" type="checkbox" checked={partner} onChange={(e) => setPartner(e.target.checked)} />
        <label htmlFor="partner" style={{ fontWeight: 700, cursor: "pointer" }}>{t.r_partner}</label>
      </div>
      {partner && (
        <fieldset className="card pad" style={{ margin: 0, gap: 14 }}>
          <legend className="sr-only">{t.r_partner}</legend>
          <p className="small">{t.p_hint}</p>
          <div className="field"><label htmlFor="partnerOrg">{t.p_org}</label><input id="partnerOrg" name="partnerOrg" className="input" maxLength={120} aria-invalid={!!errors.partnerOrg} aria-describedby={errors.partnerOrg ? "partnerOrg-e" : undefined} />{err("partnerOrg") && <span id="partnerOrg-e" className="err">{err("partnerOrg")}</span>}</div>
          <div className="field"><label htmlFor="referrerName">{t.p_name}</label><input id="referrerName" name="referrerName" className="input" maxLength={80} autoComplete="name" /></div>
          <div className="field"><label htmlFor="referrerEmail">{t.p_email}</label><input id="referrerEmail" name="referrerEmail" type="email" className="input" maxLength={120} autoComplete="email" aria-invalid={!!errors.referrerEmail} aria-describedby={errors.referrerEmail ? "referrerEmail-e" : undefined} />{err("referrerEmail") && <span id="referrerEmail-e" className="err">{err("referrerEmail")}</span>}</div>
          <div className="check" style={{ border: errors.partnerConsent ? "2px solid var(--red)" : undefined }}>
            <input id="partnerConsent" name="partnerConsent" type="checkbox" aria-describedby={errors.partnerConsent ? "pc-e" : undefined} />
            <label htmlFor="partnerConsent" style={{ cursor: "pointer" }}>{t.p_consent}</label>
          </div>
          {err("partnerConsent") && <span id="pc-e" className="err">{err("partnerConsent")}</span>}
        </fieldset>
      )}
      <p style={{ fontSize: ".875rem", color: "var(--ink-2)" }}>{t.privacy} <Link href="/privacy">{t.privacy_link}</Link></p>
      <button type="submit" className="btn btn-primary btn-block" disabled={busy} aria-busy={busy}>{busy ? t.sending : t.send}</button>
      <p className="small">{t.r_after}</p>
    </form>
  );
}
