import type { Metadata } from "next";
import { getDict } from "@/lib/lang";
import { publishedService } from "@/lib/services";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = { title: "Ask for help" };
export default async function RequestPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const { lang, t } = await getDict();
  const svc = service && /^[a-z0-9-]{1,40}$/.test(service) ? await publishedService(service, lang) : null;
  return (
    <>
      <div className="page-head"><h1>{t.r_h}</h1><p className="lede">{t.r_sub}</p></div>
      <RequestForm t={t} lang={lang} serviceId={svc?.id} serviceTitle={svc?.title ?? t.r_general} />
    </>
  );
}
