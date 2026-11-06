import Link from "next/link";
import { getDict } from "@/lib/lang";
import { Icon, Mark } from "@/components/Icon";
import { DisplaySettings, LangToggle, SessionPing, TabBar } from "@/components/client";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const { lang, t } = await getDict();
  return (
    <div className="app">
      <a href="#main" className="skip">{t.skip}</a>
      <div className="demo-note" role="note"><Icon name="info" size={16} /><span>{t.demo_banner}</span></div>
      <header className="topbar glass glass-d">
        <Link href="/" className="brand"><Mark /><span>{t.app_name}</span></Link>
        <div className="top-actions">
          <DisplaySettings t={t} />
          <LangToggle lang={lang} label={t.lang_label} />
        </div>
      </header>
      <main id="main" className="public-main" tabIndex={-1}>{children}</main>
      <TabBar t={t} />
      <SessionPing />
    </div>
  );
}
