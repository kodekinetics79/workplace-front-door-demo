import { getDict } from "@/lib/lang";
export default async function Page() { const { t } = await getDict(); return (<div className="page-head" style={{ gap: 14 }}><h1>{t.a11y_h2}</h1><p className="lede">{t.a11y_body}</p></div>); }
