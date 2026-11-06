import Link from "next/link";
import { getDict } from "@/lib/lang";
import { Icon } from "@/components/Icon";
import { Orbs } from "@/components/Orbs";
import { GoalList } from "@/components/GoalList";
import { RecentRequest } from "@/components/RecentRequest";

export default async function Home() {
  const { t } = await getDict();
  return (
    <>
      <div className="hero">
        <Orbs />
        <h1>{t.home_h}</h1>
        <p>{t.home_sub}</p>
        <form action="/services" method="get" role="search" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label htmlFor="q" style={{ fontWeight: 700, fontSize: ".875rem", color: "#E6EDF3" }}>{t.search_label}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input id="q" name="q" type="search" enterKeyHint="search" placeholder={t.search_ph} className="glass glass-d"
              style={{ flex: 1, minWidth: 0, height: 54, borderRadius: 16, border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.14)", color: "#fff", padding: "0 16px", fontSize: "1rem", boxShadow: "inset 0 1px 0 rgba(255,255,255,.22)" }} />
            <button type="submit" className="btn btn-amber" aria-label={t.search_go} style={{ width: 54, padding: 0, borderRadius: 16 }}><Icon name="search" stroke={2.4} /></button>
          </div>
        </form>
      </div>
      <section className="section" aria-labelledby="gl">
        <h2 id="gl">{t.browse}</h2>
        <GoalList t={t} />
      </section>
      <RecentRequest t={t} />
      <section className="section" aria-labelledby="pt">
        <h2 id="pt">{t.unsure_h}</h2>
        <p className="lede" style={{ fontSize: ".9375rem" }}>{t.unsure_p}</p>
        <div className="grid-2">
          <Link href="/request" className="btn btn-primary">{t.find_counselor}</Link>
          <Link href="/help" className="btn btn-secondary"><Icon name="phone" size={18} />{t.call_us}</Link>
        </div>
      </section>
    </>
  );
}
