import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { Orbs } from "@/components/Orbs";
import { EmployerForm } from "@/components/EmployerForm";
export const metadata: Metadata = { title: "Employers" };
export default async function Employers() { const { lang, t } = await getDict(); return (<><div className="hero"><Orbs /><h1>{t.e_h}</h1><p>{t.e_sub}</p></div><EmployerForm t={t} lang={lang} /></>); }
