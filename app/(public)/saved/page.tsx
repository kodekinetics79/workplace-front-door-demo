import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { SavedList } from "@/components/SavedList";
export const metadata: Metadata = { title: "Saved" };
export default async function Saved() { const { lang, t } = await getDict(); return (<><div className="page-head"><h1>{t.saved_h}</h1><p className="lede">{t.saved_sub}</p></div><SavedList t={t} lang={lang} /></>); }
