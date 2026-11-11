import Link from "next/link";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
export const metadata: Metadata = { title: "Evaluator guide" };

// Maps each RFP evaluation criterion (Section VII.B) to something the committee can try in under five minutes.
const rows: { crit: string; pts: number; try_: string; href: string; cta: string }[] = [
  { crit: "Understanding and user experience", pts: 15, try_: "Pick a goal on the home screen. You reach a service and a next step without knowing a program name. Try the lobby kiosk view too.", href: "/", cta: "Open the home screen" },
  { crit: "Technical approach", pts: 20, try_: "The same code serves the website, the staff console and a native iOS and Android app. Every rule below is enforced on the server, not in the browser.", href: "/api/health", cta: "Check system health" },
  { crit: "Two-way SMS, integrations and security", pts: 15, try_: "Send a help request and opt in to texts. Then, in the staff console, simulate a STOP reply and watch the number get suppressed. Staff sign-in uses a second factor.", href: "/request", cta: "Send a help request" },
  { crit: "Accessibility and language access", pts: 10, try_: "Switch to Spanish, raise text size, turn on high contrast, or have a service read aloud. Ask for an interpreter on the request form.", href: "/accessibility", cta: "See the accessibility settings" },
  { crit: "Analytics and equity reporting", pts: 10, try_: "Staff console, Reports: completion by language, flagged when a group trails by 10 points or more. Figures are synthetic.", href: "/staff", cta: "Open the staff console" },
  { crit: "Staffing and control", pts: 10, try_: "Staff console, Content: a service cannot be published by the person who wrote it, and not without a Spanish version. Every change lands in a tamper-evident audit log you can verify.", href: "/staff", cta: "Open the staff console" },
];

export default function Evaluate() {
  return (
    <>
      <div className="page-head">
        <h1>Evaluator guide</h1>
        <p className="lede">Five minutes, in the order of your scoring sheet. This is a demonstration built by Kode Kinetics for The WorkPlace RFP, with sample data only.</p>
      </div>
      <div className="section">
        <div className="card list">
          {rows.map((r) => (
            <Link key={r.crit} href={r.href} className="row" style={{ minHeight: 84, alignItems: "flex-start" }}>
              <span className="grow t">
                <strong>{r.crit}</strong> <span style={{ color: "var(--ink-2)" }}>({r.pts} points)</span>
                <span style={{ display: "block", marginTop: 4 }}>{r.try_}</span>
                <span style={{ display: "block", marginTop: 6, color: "var(--blue)", fontWeight: 700 }}>{r.cta}</span>
              </span>
              <Icon name="chevron" size={20} />
            </Link>
          ))}
        </div>
      </div>
      <div className="section">
        <div className="card pad" style={{ gap: 8 }}>
          <p><strong>Staff console sign-in.</strong> Counselor, content publisher and administrator accounts, with their second-factor codes, are in our submission email. On the sign-in screen, &ldquo;Show the current demo code&rdquo; displays the code for these demo accounts only.</p>
          <p><strong>What is real and what is sample.</strong> Service listings, referrals and reporting figures are sample data. The behavior is real: consent rules, role checks, audit chain, retention and rate limits run exactly as proposed.</p>
        </div>
      </div>
    </>
  );
}
