import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { EVENTS } from "@/lib/content";
import { Orbs } from "@/components/Orbs";
import { Icon } from "@/components/Icon";
export const metadata: Metadata = { title: "Young adults" };
export default async function Youth() {
  const { lang, t } = await getDict();
  const loc = lang === "es" ? "es-US" : "en-US";
  return (
    <>
      <div className="hero"><Orbs /><h1>{t.y_h}</h1><p>{t.y_sub}</p></div>
      <div className="section">
        <div className="grid-2">
          {[["/services?goal=skills", "skills", t.y_train, t.y_train_p], ["/services?goal=youth", "job", t.y_jobs, t.y_jobs_p]].map(([href, ic, a, b]) => (
            <Link key={href} href={href} className="card pad lift" style={{ minHeight: 112, textDecoration: "none", color: "var(--ink)", justifyContent: "space-between" }}>
              <span style={{ color: "var(--blue)" }}><Icon name={ic} size={26} /></span>
              <span><span style={{ display: "block", fontWeight: 800, fontSize: "1.0625rem" }}>{a}</span><span className="muted">{b}</span></span>
            </Link>))}
        </div>
      </div>
      <section className="section" aria-labelledby="ev">
        <h2 id="ev">{t.y_events}</h2>
        {EVENTS.map((e) => {
          const d = new Date(`${e.date}T${e.start}:00`);
          return (
            <article key={e.id} className="card pad" style={{ flexDirection: "row", gap: 14 }}>
              <div aria-hidden="true" style={{ width: 56, flex: "0 0 auto", borderRadius: 12, background: "var(--navy)", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--amber)" }}>{d.toLocaleDateString(loc, { month: "short" })}</span>
                <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>{d.getDate()}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <h3 style={{ fontSize: "1.0625rem", fontWeight: 800 }}>{e.title[lang]}</h3>
                <span className="muted">{d.toLocaleDateString(loc, { weekday: "long", month: "long", day: "numeric" })}, {d.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" })}</span>
                <span className="muted">{e.place[lang]}</span>
                <a href={`/api/calendar/${e.id}?lang=${lang}`} className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start", marginTop: 6 }} download><Icon name="cal" size={18} />{t.add_cal}</a>
              </div>
            </article>);
        })}
        <Link href="/request?service=youth" className="btn btn-primary btn-block">{t.y_talk}</Link>
      </section>
    </>
  );
}
