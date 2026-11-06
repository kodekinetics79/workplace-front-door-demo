import Link from "next/link";
import { requireStaffPage, allowed } from "@/lib/staffServer";
import { ROLE_LABEL } from "@/lib/rbac";
import { q1 } from "@/lib/db";
import { Mark } from "@/components/Icon";
import { LogoutButton } from "@/components/staff/actions";
import { NavLinks } from "@/components/staff/NavLinks";

export const dynamic = "force-dynamic";
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const me = await requireStaffPage();
  const counts = allowed(me, "referrals.read") ? await q1<{ open: number; unread: number }>(`SELECT (SELECT count(*) FROM referrals WHERE status <> 'closed')::int open,
    (SELECT count(*) FROM referrals r WHERE EXISTS (SELECT 1 FROM sms_messages m WHERE m.referral_id = r.id AND m.direction='in' AND m.created_at = (SELECT max(created_at) FROM sms_messages WHERE referral_id = r.id)))::int unread`) : null;
  const items = [
    { href: "/staff", label: "Referral queue", count: counts?.open, perm: allowed(me, "referrals.read") },
    { href: "/staff/inbox", label: "Text inbox", count: counts?.unread, perm: allowed(me, "referrals.read") },
    { href: "/staff/content", label: "Content", perm: allowed(me, "content.edit") },
    { href: "/staff/reports", label: "Reports", perm: allowed(me, "reports.read") },
    { href: "/staff/audit", label: "Audit and data", perm: allowed(me, "audit.read") },
  ].filter((i) => i.perm).map((i) => ({ href: i.href, label: i.label, count: i.count }));
  const note = { counselor: "Counselor access: referral queue and text inbox. No content publishing, reports or audit log.", publisher: "Content publisher access: create and edit service cards and submit them for review. No access to referrals or personal data.", admin: "Administrator access: every section, approval to publish, reports, audit log and data export. Every action is recorded." }[me.role];
  return (
    <div className="console">
      <a href="#c-main" className="skip">Skip to main content</a>
      <header className="c-top glass">
        <Link href="/staff" style={{ display: "flex", alignItems: "center", gap: 10, color: "#fff", textDecoration: "none" }}><Mark /><span style={{ fontWeight: 800, fontSize: "1.0625rem" }}>The WorkPlace</span><span style={{ color: "var(--on-navy)", fontSize: ".875rem" }}>Staff console</span></Link>
        <span style={{ fontSize: ".8125rem", fontWeight: 700, background: "var(--amber-soft)", color: "var(--amber-ink)", borderRadius: 6, padding: "3px 9px" }}>Demonstration with sample data</span>
        <div className="who"><span>{me.name} · {ROLE_LABEL[me.role]}</span><span className="badge-mfa">MFA verified</span><Link href="/" style={{ color: "#fff" }}>Public app</Link><LogoutButton /></div>
      </header>
      <div className="c-body">
        <NavLinks items={items} note={note} />
        <main id="c-main" className="c-main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
