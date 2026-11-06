"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "@/lib/i18n";

export function EmployerForm({ t, lang }: { t: Dict; lang: "en" | "es" }) {
  const router = useRouter();
  const [need, setNeed] = useState<"recruit" | "train" | "event">("recruit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  const err = (k: string) => (errors[k] ? (t as Record<string, string>)[errors[k]] ?? t.e_req : null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; const f = new FormData(e.currentTarget);
    const body = { kind: "employer", lang, need, company: f.get("company"), firstName: f.get("contact"), email: f.get("email"), phone: f.get("phone") || undefined, openings: f.get("openings") || undefined, note: f.get("note") || undefined, website: f.get("website") };
    setBusy(true); setFormError(null);
    try {
      const r = await fetch("/api/requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 422) { setErrors(d.errors ?? {}); setTimeout(() => alertRef.current?.focus(), 0); return; }
      if (!r.ok) { setFormError(r.status === 429 ? t.e_rate : t.e_generic); setTimeout(() => alertRef.current?.focus(), 0); return; }
      try { localStorage.setItem("wp_last_ref", d.ref); } catch {}
      router.push(`/done?ref=${d.ref}&m=email`);
    } catch { setFormError(t.e_generic); } finally { setBusy(false); }
  }
  const opts = [["recruit", t.e_o1, t.e_o1p], ["train", t.e_o2, t.e_o2p], ["event", t.e_o3, t.e_o3p]] as const;
  return (
    <form onSubmit={submit} noValidate className="section" style={{ gap: 18 }}>
      <fieldset style={{ border: 0, margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <legend className="legend" style={{ marginBottom: 8 }}>{t.e_need}</legend>
        {opts.map(([k, a, b]) => (
          <label key={k} className="card" style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", minHeight: 72, cursor: "pointer", border: need === k ? "2px solid var(--blue)" : undefined, background: need === k ? "#F3F8FD" : undefined }}>
            <input type="radio" name="need" value={k} checked={need === k} onChange={() => setNeed(k)} style={{ width: 22, height: 22, accentColor: "var(--blue)" }} />
            <span><span style={{ display: "block", fontWeight: 800 }}>{a}</span><span className="muted">{b}</span></span>
          </label>))}
      </fieldset>
      {(Object.keys(errors).length > 0 || formError) && <div ref={alertRef} tabIndex={-1} role="alert" className="alert">{formError ?? t.r_fix}</div>}
      {([["company", t.e_company, "organization", "text"], ["contact", t.e_contact, "name", "text"], ["email", t.e_email2, "email", "email"], ["phone", t.e_phone2, "tel", "tel"]] as const).map(([k, l, ac, ty]) => {
        const ek = k === "contact" ? "firstName" : k;
        return (
          <div key={k} className="field"><label htmlFor={`e-${k}`}>{l}</label>
            <input id={`e-${k}`} name={k} type={ty} autoComplete={ac} className="input" aria-invalid={!!errors[ek]} aria-describedby={errors[ek] ? `e-${k}-err` : undefined} maxLength={120} />
            {err(ek) && <span id={`e-${k}-err`} className="err">{err(ek)}</span>}</div>);
      })}
      <div className="field"><label htmlFor="e-openings">{t.e_openings}</label><input id="e-openings" name="openings" type="number" min={0} inputMode="numeric" className="input" /></div>
      <div className="field"><label htmlFor="e-note">{t.r_note}</label><textarea id="e-note" name="note" className="textarea" maxLength={600} /></div>
      <div aria-hidden="true" style={{ position: "absolute", left: -9999 }}><input name="website" tabIndex={-1} autoComplete="off" /></div>
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? t.sending : t.e_send}</button>
      <p className="small">{t.e_note}</p>
    </form>
  );
}
