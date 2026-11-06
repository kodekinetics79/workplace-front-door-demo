import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { TrackForm } from "@/components/TrackForm";
export const metadata: Metadata = { title: "Track a request" };
export default async function Track({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams; const { lang, t } = await getDict();
  return (<><div className="page-head"><h1>{t.t_h}</h1><p className="lede">{t.t_sub}</p></div><TrackForm t={t} lang={lang} initialRef={/^W[PB]-\d{6}$/.test(ref ?? "") ? ref : undefined} /></>);
}
