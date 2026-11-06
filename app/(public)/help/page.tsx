import Link from "next/link";
import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { Icon } from "@/components/Icon";
export const metadata: Metadata = { title: "Help" };
export default async function Help() {
  const { lang, t } = await getDict();
  const phone = process.env.NEXT_PUBLIC_WORKPLACE_PHONE || "";
  const rows: [string, string, string][] = [
    [phone ? `tel:${phone}` : "/request", "phone", t.h_call], [phone ? `sms:${phone}` : "/request", "chat", t.h_text], ["/request", "pin", t.h_visit],
    ["/privacy", "shield", t.h_privacy], ["/accessibility", "access", t.h_a11y],
  ];
  return (
    <>
      <div className="page-head"><h1>{t.h_h}</h1><p className="lede">{t.h_sub}</p></div>
      <div className="section">
        <div className="card list">{rows.map(([href, ic, l]) => (
          <Link key={l} href={href} className="row" style={{ minHeight: 68 }}>
            <span className="tile" style={{ background: "var(--blue-tint)", color: "var(--blue)", width: 44, height: 44 }}><Icon name={ic} /></span>
            <span className="grow t">{l}</span><Icon name="chevron" size={20} />
          </Link>))}
        </div>
      </div>
      <section className="section" aria-labelledby="sm">
        <h2 id="sm">{t.sms_how_h}</h2>
        <p className="lede" style={{ fontSize: ".9375rem" }}>{t.sms_how_p}</p>
        <div className="card pad" style={{ gap: 8 }} aria-label="Sample conversation">
          <div className="bubble-in">{lang === "es" ? "The WorkPlace: Hola Maria, un asesor le llamará mañana entre las 10 a. m. y las 12 p. m. Responda C para confirmar o R para cambiar la hora. Responda STOP para cancelar." : "The WorkPlace: Hi Maria, a career coach will call you tomorrow between 10 a.m. and 12 p.m. Reply C to confirm or R to reschedule. Reply STOP to opt out."}</div>
          <div className="bubble-out">C</div>
          <div className="bubble-in">{lang === "es" ? "The WorkPlace: Gracias, quedó confirmado." : "The WorkPlace: Thanks, you are confirmed."}</div>
        </div>
      </section>
    </>
  );
}
