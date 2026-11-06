import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { publishedServices, searchServices } from "@/lib/services";
import { fmt } from "@/lib/i18n";
import { Icon } from "@/components/Icon";
import { SaveButton, Ping, NearestArea } from "@/components/client";

export const metadata: Metadata = { title: "Services" };
const GOAL_KEYS = ["job", "skills", "help", "youth"] as const;

export default async function Services({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { lang, t } = await getDict();
  const goal = GOAL_KEYS.includes(sp.goal as (typeof GOAL_KEYS)[number]) ? sp.goal! : undefined;
  const q = (sp.q ?? "").slice(0, 80);
  const town = ["bridgeport", "stamford", "valley", "online"].includes(sp.town ?? "") ? sp.town! : "all";
  const format = ["inperson", "phone", "online"].includes(sp.format ?? "") ? sp.format! : "all";
  const all = await publishedServices(lang);
  const results = searchServices(all, { goal: q ? undefined : goal ?? (q ? undefined : undefined), q, town, format });
  const goalTitle: Record<string, string> = { job: t.g_job, skills: t.g_skills, help: t.g_help, youth: t.g_youth };
  const title = q ? fmt(t.q_title, { q }) : goal ? goalTitle[goal] : t.browse;
  const link = (patch: Record<string, string>) => { const p = new URLSearchParams(); if (goal && !q) p.set("goal", goal); if (q) p.set("q", q); if (town !== "all") p.set("town", town); if (format !== "all") p.set("format", format); for (const [k, v] of Object.entries(patch)) { if (v === "all") p.delete(k); else p.set(k, v); } return `/services?${p}`; };
  return (
    <>
      {q && <Ping name="search" props={{ results: results.length }} />}
      <div className="page-head">
        <h1>{title}</h1>
        <p className="lede" style={{ fontSize: ".9375rem" }}>{t.results_sub}</p>
      </div>
      <div className="section">
        <form method="get" action="/services" className="field">
          {goal && !q && <input type="hidden" name="goal" value={goal} />}
          {q && <input type="hidden" name="q" value={q} />}
          {format !== "all" && <input type="hidden" name="format" value={format} />}
          <label htmlFor="town">{t.where}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select id="town" name="town" defaultValue={town} className="select" style={{ flex: 1 }}>
              <option value="all">{t.town_all}</option><option value="bridgeport">Bridgeport</option><option value="stamford">Stamford</option>
              <option value="valley">{lang === "es" ? "Valle del Bajo Naugatuck" : "Lower Naugatuck Valley"}</option><option value="online">{lang === "es" ? "En línea" : "Online"}</option>
            </select>
            <button type="submit" className="btn btn-quiet">{t.apply}</button>
          </div>
        </form>
        <NearestArea t={t} hidden={{ ...(goal && !q ? { goal } : {}), ...(q ? { q } : {}), ...(format !== "all" ? { format } : {}) }} />
        <nav aria-label={t.format} className="chips">
          {[["all", t.f_all], ["inperson", lang === "es" ? "En persona" : "In person"], ["phone", lang === "es" ? "Teléfono" : "Phone"], ["online", lang === "es" ? "En línea" : "Online"]].map(([k, l]) => (
            <Link key={k} href={link({ format: k })} className="chip" aria-current={format === k ? "true" : undefined}>{l}</Link>
          ))}
        </nav>
        <p aria-live="polite" style={{ fontWeight: 700, color: "var(--ink-2)", fontSize: ".875rem" }}>{results.length === 1 ? t.n_one : fmt(t.n_many, { n: results.length })}</p>
        {results.map((s) => (
          <article key={s.id} className="card pad lift">
            <h2 style={{ fontSize: "1.1875rem", fontWeight: 800, lineHeight: 1.25 }}>{s.title}</h2>
            <p style={{ color: "var(--ink-2)", fontSize: ".9375rem" }}>{s.sum}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <span className="tag">{s.type}</span>{s.formatLabels.map((f) => <span key={f} className="tag-quiet">{f}</span>)}
            </div>
            <p className="muted" style={{ display: "flex", gap: 6, alignItems: "center" }}><Icon name="pin" size={16} />{s.townLabels.join(", ")}</p>
            <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
              <Link href={`/services/${s.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>{t.view}</Link>
              <SaveButton id={s.id} title={s.title} t={t} />
            </div>
          </article>
        ))}
        {results.length === 0 && (
          <div className="card pad" style={{ borderStyle: "dashed" }}>
            <h2 className="h2">{t.none_h}</h2>
            <p className="lede" style={{ fontSize: ".9375rem" }}>{t.none_p}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href={goal ? `/services?goal=${goal}` : "/services"} className="btn btn-secondary btn-sm">{t.clear}</Link>
              <Link href="/request" className="btn btn-primary btn-sm">{t.find_counselor}</Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
