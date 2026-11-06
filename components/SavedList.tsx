"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSaved, toggleSaved } from "./client";
import { Icon } from "./Icon";
import type { Dict } from "@/lib/i18n";
type Svc = { id: string; title: string; townLabels: string[] };
export function SavedList({ t, lang }: { t: Dict; lang: string }) {
  const ids = useSaved();
  const [items, setItems] = useState<Svc[] | null>(null);
  useEffect(() => {
    if (!ids.length) { setItems([]); return; }
    fetch(`/api/services?ids=${ids.join(",")}&lang=${lang}`).then((r) => r.json()).then((d) => setItems(d.services ?? [])).catch(() => setItems([]));
  }, [ids, lang]);
  if (items === null) return <p className="muted section">…</p>;
  if (!items.length) return (
    <div className="section"><div className="card pad" style={{ borderStyle: "dashed", alignItems: "flex-start" }}>
      <Icon name="bookmark" size={28} /><h2 className="h2">{t.saved_none}</h2><p className="lede" style={{ fontSize: ".9375rem" }}>{t.saved_hint}</p>
      <Link href="/" className="btn btn-primary btn-sm">{t.browse}</Link>
    </div></div>
  );
  return (
    <div className="section">{items.map((s) => (
      <article key={s.id} className="card pad">
        <h2 className="h2">{s.title}</h2><p className="muted">{s.townLabels.join(", ")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/services/${s.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>{t.view}</Link>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => toggleSaved(s.id)}>{t.remove}</button>
        </div>
      </article>))}
    </div>
  );
}
