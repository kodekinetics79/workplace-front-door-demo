"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n";
export function RecentRequest({ t }: { t: Dict }) {
  const [ref, setRef] = useState<string | null>(null);
  useEffect(() => { try { setRef(localStorage.getItem("wp_last_ref")); } catch {} }, []);
  if (!ref) return (
    <section className="section" aria-labelledby="trk-h">
      <h2 id="trk-h">{t.track_h}</h2>
      <p className="lede" style={{ fontSize: ".9375rem" }}>{t.track_p}</p>
      <Link href="/track" className="btn btn-secondary">{t.track_btn}</Link>
    </section>
  );
  return (
    <section className="section" aria-labelledby="trk-h">
      <div className="card pad" style={{ boxShadow: "var(--shadow-lift)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <h2 id="trk-h" className="h2">{t.track_h}</h2>
          <span style={{ fontWeight: 800, color: "var(--ink-2)" }}>{ref}</span>
        </div>
        <p className="lede" style={{ fontSize: ".9375rem" }}>{t.keep_ref}</p>
        <Link href={`/track?ref=${encodeURIComponent(ref)}`} className="btn btn-secondary">{t.track_this}</Link>
      </div>
    </section>
  );
}
