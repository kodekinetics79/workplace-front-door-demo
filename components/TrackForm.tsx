"use client";
import { useRef, useState } from "react";
import { RouteLine, type Step } from "./Route";
import type { Dict } from "@/lib/i18n";

type Result = { ref: string; kind: string; status: string; step: number; method: string; updatedAt: string };
export function TrackForm({ t, lang, initialRef }: { t: Dict; lang: "en" | "es"; initialRef?: string }) {
  const [res, setRes] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const out = useRef<HTMLDivElement>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    setBusy(true); setError(null); setRes(null);
    try {
      const r = await fetch("/api/track", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ref: f.get("ref"), check: f.get("check") }) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 429) setError(t.e_rate); else if (!r.ok) setError(t.t_notfound); else setRes(d);
    } catch { setError(t.e_generic); } finally { setBusy(false); setTimeout(() => out.current?.focus(), 0); }
  }
  const labels = res?.kind === "employer" ? [t.st1, t.est2, t.est3, t.est4] : [t.st1, t.st2, t.st3, t.st4];
  const steps: Step[] = res ? labels.map((title, i) => {
    const doneIdx = res.status === "closed" ? 4 : res.step + 1;
    const state = i < doneIdx ? "done" : i === doneIdx ? "now" : "later";
    return { title, text: "", state, tag: state === "done" ? t.tag_done : state === "now" ? t.tag_now : undefined };
  }) : [];
  return (
    <div className="section" style={{ gap: 18 }}>
      <form onSubmit={submit} className="card pad" style={{ gap: 14 }}>
        <div className="field"><label htmlFor="ref">{t.t_ref}</label><input id="ref" name="ref" className="input" defaultValue={initialRef} placeholder="WP-123456" autoCapitalize="characters" required maxLength={12} /></div>
        <div className="field"><label htmlFor="check">{t.t_check}</label><input id="check" name="check" className="input" required maxLength={40} autoComplete="off" /></div>
        <button className="btn btn-primary" disabled={busy}>{busy ? t.sending : t.t_go}</button>
      </form>
      <div ref={out} tabIndex={-1} aria-live="polite">
        {error && <div role="alert" className="alert">{error}</div>}
        {res && (
          <div className="card pad" style={{ gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><h2 className="h2">{res.ref}</h2><span className="pill-now">{(t as Record<string, string>)[`s_${res.status}`]}</span></div>
            <RouteLine steps={steps} />
            <p className="small">{t.t_updated}: {new Date(res.updatedAt).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
        )}
      </div>
    </div>
  );
}
