import Link from "next/link";
import { notFound } from "next/navigation";
import { getDict } from "@/lib/lang";
import { publishedService } from "@/lib/services";
import { Orbs } from "@/components/Orbs";
import { SaveButton, ListenButton, Ping } from "@/components/client";
import { Icon } from "@/components/Icon";

export default async function ServiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getDict();
  if (!/^[a-z0-9-]{1,40}$/.test(id)) notFound();
  const s = await publishedService(id, lang);
  if (!s) notFound();
  const speech = [s.title, s.sum, t.d_who, s.who, t.d_how, s.how, t.d_bring, s.bring].join(". ");
  const steps = [[t.p1, t.p1x], [t.p2, t.p2x], [t.p3, t.p3x]];
  return (
    <>
      <Ping name="service_view" props={{ id: s.id }} />
      <div className="hero">
        <Orbs />
        <span className="chip-amber">{s.type}</span>
        <h1 style={{ fontSize: "1.75rem" }}>{s.title}</h1>
        <p>{s.sum}</p>
        <ListenButton text={speech} lang={lang} t={t} />
      </div>
      <div className="section">
        <dl className="card facts">
          <div><dt>{t.d_who}</dt><dd>{s.who}</dd></div>
          <div><dt>{t.d_how}</dt><dd>{s.how}</dd></div>
          <div><dt>{t.d_where}</dt><dd>{s.townLabels.join(", ")}. {s.formatLabels.join(", ")}.</dd></div>
          <div><dt>{t.d_bring}</dt><dd>{s.bring}</dd></div>
        </dl>
      </div>
      <section className="section" aria-labelledby="nx">
        <h2 id="nx">{t.d_next_h}</h2>
        <ol className="route compact">
          {steps.map(([a, b], i) => (
            <li key={a}>
              <div className="rail" aria-hidden="true"><span className="dot later" />{i < steps.length - 1 && <span className="seg-line" />}</div>
              <div className="body"><span style={{ fontSize: ".9375rem" }}><strong>{a}</strong> <span style={{ color: "var(--ink-2)" }}>{b}</span></span></div>
            </li>
          ))}
        </ol>
        <Link href={`/request?service=${s.id}`} className="btn btn-primary btn-block">{t.request_help}</Link>
        <div className="grid-2">
          <SaveButton id={s.id} title={s.title} t={t} variant="full" />
          <Link href="/help" className="btn btn-secondary btn-sm"><Icon name="phone" size={18} />{t.call_us}</Link>
        </div>
        <p className="small">{t.d_owner}</p>
      </section>
    </>
  );
}
