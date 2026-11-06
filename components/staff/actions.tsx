"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";

async function call(url: string, method: string, body?: unknown) {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || d.error || `Request failed (${r.status})`);
  return d;
}
function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<unknown>, okText?: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (okText) setMsg({ ok: true, text: okText }); router.refresh(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  };
  return { busy, msg, run };
}
const Msg = ({ m }: { m: { ok: boolean; text: string } | null }) => m ? <div role={m.ok ? "status" : "alert"} className={m.ok ? "ok-box" : "warn"}>{m.text}</div> : null;

export function LogoutButton() {
  const router = useRouter();
  return <button type="button" className="c-btn" style={{ borderColor: "rgba(255,255,255,.4)", color: "#fff", background: "transparent" }}
    onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/staff/login"); router.refresh(); }}><Icon name="logout" size={16} />Sign out</button>;
}

export function LoginForm({ accounts, demoMode }: { accounts: { email: string; role: string; password: string; name: string }[]; demoMode: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState<string | null>(null); const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<{ code: string; secondsLeft: number } | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (challenge) codeRef.current?.focus(); }, [challenge]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      if (!challenge) {
        const d = await call("/api/auth/login", "POST", { email, password });
        if (d.mfa) { setChallenge(d.mfa); return; }
      } else { await call("/api/auth/mfa", "POST", { challenge, code }); }
      router.push("/staff"); router.refresh();
    } catch (x) { setErr((x as Error).message); if ((x as Error).message.includes("expired")) { setChallenge(null); setCode(""); } } finally { setBusy(false); }
  }
  async function showDemoCode() { try { setDemoCode(await call("/api/auth/demo-code", "POST", { email })); } catch (x) { setErr((x as Error).message); } }
  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {err && <div role="alert" className="alert">{err}</div>}
      {!challenge ? (<>
        <div className="field"><label htmlFor="em">Work email</label><input id="em" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="field"><label htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
      </>) : (<>
        <p style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon name="lock" size={18} /><span>Step 2 of 2: enter the 6-digit code from your authenticator app.</span></p>
        <div className="field"><label htmlFor="otp">Authenticator code</label><input ref={codeRef} id="otp" className="input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} required style={{ letterSpacing: ".3em", fontSize: "1.25rem" }} /></div>
        <button className="btn btn-primary" disabled={busy || code.length !== 6}>{busy ? "Verifying…" : "Sign in"}</button>
        {demoMode && (
          <div className="note" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <span className="small" style={{ color: "var(--ink-2)" }}>Evaluator helper for demo accounts only. In production each person scans a QR code once into their own authenticator app.</span>
            <button type="button" className="c-btn" onClick={showDemoCode}>Show the current demo code</button>
            {demoCode && <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: ".2em" }} aria-live="polite">{demoCode.code} <span className="small" style={{ letterSpacing: 0, fontWeight: 400 }}>changes in {demoCode.secondsLeft}s</span></span>}
          </div>)}
        <button type="button" className="c-btn" onClick={() => { setChallenge(null); setCode(""); setDemoCode(null); }}>Start again</button>
      </>)}
      {!challenge && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontWeight: 700 }}>Demo accounts for evaluators</p>
          {accounts.map((a) => (
            <button key={a.email} type="button" className="c-btn" style={{ justifyContent: "space-between", minHeight: 44 }} onClick={() => { setEmail(a.email); setPassword(a.password); }}>
              <span>{a.role}</span><span style={{ fontWeight: 600, color: "var(--ink-2)" }}>{a.name}</span>
            </button>))}
          <p className="small">Choosing an account fills in its demo credentials. Every staff account requires a password and an authenticator code. Single sign-on with Microsoft Entra ID is available as an option.</p>
        </div>)}
    </form>
  );
}

export function ReferralControls({ id, status, assigned, staff }: { id: string; status: string; assigned: string | null; staff: { id: string; name: string }[] }) {
  const { busy, msg, run } = useAction();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-3)" }}>Status
          <select className="c-input" value={status} disabled={busy} onChange={(e) => run(() => call(`/api/staff/referrals/${id}`, "PATCH", { status: e.target.value }), "Status updated")}>
            <option value="new">New</option><option value="review">Staff review</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
          </select></label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-3)" }}>Assigned to
          <select className="c-input" value={assigned ?? ""} disabled={busy} onChange={(e) => run(() => call(`/api/staff/referrals/${id}`, "PATCH", { assignedTo: e.target.value || null }), "Assignment updated")}>
            <option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
      </div>
      <Msg m={msg} />
    </div>
  );
}

const segs = (t: string) => { const n = [...t].length; const uni = /[^\x00-\x7F£¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ¡ÄÖÑÜ§¿äöñüà€]/.test(t); return !n ? 0 : uni ? (n <= 70 ? 1 : Math.ceil(n / 67)) : n <= 160 ? 1 : Math.ceil(n / 153); };

export function SmsComposer({ id, canText, reason, firstName, lang }: { id: string; canText: boolean; reason: string; firstName: string; lang: string }) {
  const { busy, msg, run } = useAction();
  const [body, setBody] = useState("");
  const es = lang === "es";
  const templates = [
    ["Callback scheduled", es ? `The WorkPlace: Hola ${firstName}, le llamaremos mañana por la mañana. Responda C para confirmar o R para cambiar la hora. Responda STOP para cancelar.` : `The WorkPlace: Hi ${firstName}, a staff member will call you tomorrow morning. Reply C to confirm or R to reschedule. Reply STOP to opt out.`],
    ["Missed you", es ? `The WorkPlace: Hola ${firstName}, intentamos llamarle hoy. Responda con un buen horario. Responda STOP para cancelar.` : `The WorkPlace: Hi ${firstName}, we tried to reach you today. Reply with a good time to call. Reply STOP to opt out.`],
    ["Next step reminder", es ? `The WorkPlace: Hola ${firstName}, le recordamos su próximo paso con nosotros. Los detalles se darán por teléfono. Responda STOP para cancelar.` : `The WorkPlace: Hi ${firstName}, a reminder about your next step with us. Details will be shared by phone. Reply STOP to opt out.`],
  ];
  const n = segs(body);
  if (!canText) return <div role="note" className="warn">{reason}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="pills" aria-label="Approved templates">{templates.map(([l, tx]) => <button key={l} type="button" className="c-btn" style={{ minHeight: 32, borderRadius: 16 }} onClick={() => setBody(tx)}>{l}</button>)}</div>
      <label htmlFor="sms-body" style={{ fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-3)" }}>Reply {es ? "(Spanish preferred)" : ""}</label>
      <textarea id="sms-body" className="c-input" value={body} onChange={(e) => setBody(e.target.value)} maxLength={640} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span className="small">{[...body].length} characters · {n} segment{n === 1 ? "" : "s"}</span>
        <button type="button" className="c-btn primary" disabled={busy || !body.trim()} onClick={() => run(async () => { await call(`/api/staff/referrals/${id}/sms`, "POST", { body }); setBody(""); }, "Text sent")}><Icon name="send" size={16} />Send text</button>
      </div>
      <p className="small">Do not send eligibility, health, income or ID details by text. Messages that look like ID or card numbers are blocked.</p>
      <Msg m={msg} />
    </div>
  );
}

export function SimulateInbound({ id }: { id: string }) {
  const { busy, msg, run } = useAction();
  return (
    <details style={{ fontSize: ".875rem" }}>
      <summary style={{ cursor: "pointer", fontWeight: 700 }}>Demo tool: simulate a reply from this person</summary>
      <div className="pills" style={{ marginTop: 8 }}>
        {["C", "R", "HELP", "STOP", "START", "Can you call after 3?"].map((b) => <button key={b} type="button" className="c-btn" disabled={busy} style={{ minHeight: 32, borderRadius: 16 }} onClick={() => run(() => call("/api/staff/sms/simulate", "POST", { referralId: id, body: b }), `Simulated "${b}"`)}>{b}</button>)}
      </div>
      <div style={{ marginTop: 8 }}><Msg m={msg} /></div>
    </details>
  );
}

export function NoteForm({ id }: { id: string }) {
  const { busy, msg, run } = useAction(); const [body, setBody] = useState("");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor="note" style={{ fontWeight: 800 }}>Case note</label>
      <textarea id="note" className="c-input" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} style={{ minHeight: 60 }} />
      <button type="button" className="c-btn" style={{ alignSelf: "flex-start" }} disabled={busy || !body.trim()} onClick={() => run(async () => { await call(`/api/staff/referrals/${id}/notes`, "POST", { body }); setBody(""); }, "Note added")}>Add note</button>
      <Msg m={msg} />
    </div>
  );
}

type Txt = { type: string; title: string; sum: string; who: string; how: string; bring: string };
export function ContentEditor({ id, draft, state, canEdit, canApprove, isSubmitter }: { id: string; draft: { en: Txt; es: Txt }; state: string; canEdit: boolean; canApprove: boolean; isSubmitter: boolean }) {
  const { busy, msg, run } = useAction();
  const [d, setD] = useState(draft);
  const locked = !canEdit || state === "review";
  const set = (l: "en" | "es", k: keyof Txt, v: string) => setD((p) => ({ ...p, [l]: { ...p[l], [k]: v } }));
  const words = d.en.sum.split(/\s+/).filter(Boolean);
  const sentences = Math.max(1, (d.en.sum.match(/[.!?]+/g) ?? []).length);
  const syl = words.reduce((a, w) => a + Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length), 0);
  const grade = words.length >= 5 ? Math.max(1, Math.round(0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59)) : null;
  const fields: [keyof Txt, string, boolean][] = [["title", "Title", false], ["type", "Category", false], ["sum", "Plain-language summary", true], ["who", "Who it helps", true], ["how", "How it works", true], ["bring", "What to bring", true]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {(["en", "es"] as const).map((l) => (
          <fieldset key={l} lang={l} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 10, margin: 0 }}>
            <legend style={{ fontWeight: 800, padding: "0 6px" }}>{l === "en" ? "English" : "Español"}</legend>
            {fields.map(([k, label, multi]) => (
              <label key={k} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".8125rem", fontWeight: 700, color: "var(--ink-3)" }}>{label}
                {multi ? <textarea className="c-input" value={d[l][k]} readOnly={locked} onChange={(e) => set(l, k, e.target.value)} style={{ minHeight: 64 }} />
                  : <input className="c-input" value={d[l][k]} readOnly={locked} onChange={(e) => set(l, k, e.target.value)} />}
                {!d[l][k].trim() && <span className="err" style={{ fontSize: ".75rem" }}>Missing</span>}
              </label>))}
          </fieldset>))}
      </div>
      <p className="small">{grade ? `English summary reads at about grade ${grade}. Target grade 6 to 8.` : "Write a summary of at least five words to see its reading level."}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {canEdit && state !== "review" && <button type="button" className="c-btn" disabled={busy} onClick={() => run(() => call(`/api/staff/services/${id}`, "PUT", d), "Draft saved. The public page is unchanged until approval.")}>Save draft</button>}
        {canEdit && state === "draft" && <button type="button" className="c-btn primary" disabled={busy} onClick={() => run(async () => { await call(`/api/staff/services/${id}`, "PUT", d); await call(`/api/staff/services/${id}/transition`, "POST", { action: "submit" }); }, "Submitted for administrator review")}>Submit for review</button>}
        {canApprove && state === "review" && <button type="button" className="c-btn primary" disabled={busy || isSubmitter} title={isSubmitter ? "You submitted this card, so another administrator must approve it" : undefined} onClick={() => run(() => call(`/api/staff/services/${id}/transition`, "POST", { action: "approve" }), "Published in English and Spanish")}>Approve and publish</button>}
        {canApprove && state === "review" && <button type="button" className="c-btn" disabled={busy} onClick={() => run(() => call(`/api/staff/services/${id}/transition`, "POST", { action: "return" }), "Returned to draft")}>Return to draft</button>}
        {!canApprove && state === "review" && <span className="warn">Waiting for an administrator to approve.</span>}
      </div>
      <p className="small">Two-person rule: publishers submit and an administrator approves. Cards cannot go live without a complete Spanish version. Every change is versioned and recorded in the audit log.</p>
      <Msg m={msg} />
    </div>
  );
}

export function VerifyAudit() {
  const [res, setRes] = useState<{ ok: boolean; checked: number; brokenAt?: number } | null>(null); const [busy, setBusy] = useState(false);
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" className="c-btn primary" disabled={busy} onClick={async () => { setBusy(true); try { setRes(await call("/api/staff/audit", "GET")); } finally { setBusy(false); } }}><Icon name="lock" size={16} />Verify integrity</button>
      {res && (res.ok ? <span role="status" className="ok-box">Chain intact: {res.checked} entries verified. No entry has been edited, inserted or deleted.</span> : <span role="alert" className="warn">Chain broken at entry {res.brokenAt}. Investigate under the incident response runbook.</span>)}
    </div>
  );
}

export function ResetDemo() {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState(false);
  if (!confirm) return <button type="button" className="c-btn danger" onClick={() => setConfirm(true)}><Icon name="refresh" size={16} />Reset demo data</button>;
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span className="warn">This deletes all demo requests and signs everyone out.</span>
      <button type="button" className="c-btn danger" disabled={busy} onClick={async () => { setBusy(true); await fetch("/api/staff/reset", { method: "POST" }); router.push("/staff/login"); router.refresh(); }}>Confirm reset</button>
      <button type="button" className="c-btn" onClick={() => setConfirm(false)}>Cancel</button>
    </span>
  );
}
