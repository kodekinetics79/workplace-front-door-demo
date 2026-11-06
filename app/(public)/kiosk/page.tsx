import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import QRCode from "qrcode";
import { getDict } from "@/lib/lang";
import { Orbs } from "@/components/Orbs";
import { GoalList } from "@/components/GoalList";
import { KioskToggle } from "@/components/client";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Lobby kiosk" };
export default async function Kiosk() {
  const { t } = await getDict();
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const svg = await QRCode.toString(`${proto}://${host}/`, { type: "svg", margin: 1, color: { dark: "#12304A", light: "#FFFFFF" } });
  return (
    <>
      <div className="hero" style={{ paddingTop: 24, paddingBottom: 32 }}>
        <Orbs />
        <h1 style={{ fontSize: "2.125rem" }}>{t.k_h}</h1>
        <p style={{ fontSize: "1.125rem" }}>{t.k_sub}</p>
      </div>
      <div className="section"><GoalList t={t} /></div>
      <div className="section">
        <div className="card pad" style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <div aria-hidden="true" style={{ width: 120, height: 120, flex: "0 0 auto" }} dangerouslySetInnerHTML={{ __html: svg }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}><h2 className="h2">{t.k_phone}</h2><p className="lede" style={{ fontSize: ".9375rem" }}>{t.k_phone_p}</p></div>
        </div>
        <Link href="/help" className="btn btn-secondary btn-block"><Icon name="help" size={20} />{t.k_staff}</Link>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", paddingTop: 12 }}>
          <p className="small">{t.kiosk}</p>
          <KioskToggle t={t} />
        </div>
      </div>
    </>
  );
}
