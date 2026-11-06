import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { Orbs } from "@/components/Orbs";
import { RouteLine, type Step } from "@/components/Route";
import { Icon } from "@/components/Icon";
import { publishedService } from "@/lib/services";

export const metadata: Metadata = { title: "Request received" };
export default async function Done({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { lang, t } = await getDict();
  const ref = /^W[PB]-\d{6}$/.test(sp.ref ?? "") ? sp.ref! : null;
  if (!ref) return <div className="page-head"><h1>{t.t_notfound}</h1><Link href="/" className="btn btn-primary">{t.back_discover}</Link></div>;
  const employer = ref.startsWith("WB");
  const method = (["callback", "email", "text"].includes(sp.m ?? "") ? sp.m : "callback") as "callback" | "email" | "text";
  const svc = sp.service && /^[a-z0-9-]{1,40}$/.test(sp.service) ? await publishedService(sp.service, lang) : null;
  const steps: Step[] = employer
    ? [{ title: t.st1, text: t.st1x, state: "done", tag: t.tag_done }, { title: t.est2, text: t.est2x, state: "now", tag: t.tag_now }, { title: t.est3, text: t.est3x, state: "later" }, { title: t.est4, text: t.est4x, state: "later" }]
    : [{ title: t.st1, text: t.st1x, state: "done", tag: t.tag_done }, { title: t.st2, text: t.st2x, state: "now", tag: t.tag_now }, { title: t.st3, text: t[`st3_${method}`], state: "later" }, { title: t.st4, text: t.st4x, state: "later" }];
  return (
    <>
      <div className="hero" role="status">
        <Orbs />
        <h1>{employer ? t.heading_emp : t.heading}</h1>
        <div className="refcard glass glass-d">
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: ".875rem", color: "var(--on-navy)" }}>{t.ref}</span><span className="code">{ref}</span></div>
          <span className="chip-amber">{t.received}</span>
        </div>
        <p>{svc ? `${t.r_about} ${svc.title}` : t.keep_ref}</p>
      </div>
      <section className="section" aria-labelledby="nx">
        <h2 id="nx" style={{ fontSize: "1.1875rem" }}>{t.next_h}</h2>
        <RouteLine steps={steps} />
        {sp.sms === "1" && <div className="card pad" style={{ flexDirection: "row" }}><Icon name="chat" size={20} /><span style={{ color: "var(--ink-2)" }}>{t.sms_done}</span></div>}
        <Link href={`/track?ref=${ref}`} className="btn btn-secondary btn-block">{t.track_this}</Link>
        <Link href="/" className="btn btn-primary btn-block">{t.back_discover}</Link>
      </section>
    </>
  );
}
