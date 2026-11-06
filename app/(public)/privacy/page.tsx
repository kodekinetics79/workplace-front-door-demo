import { getDict } from "@/lib/lang";
export default async function Page() { const { t } = await getDict(); return (<div className="page-head" style={{ gap: 14 }}><h1>{t.privacy_h}</h1><p className="lede">{t.privacy_body}</p></div>); }
