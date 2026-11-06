import { requireStaffPage, allowed } from "@/lib/staffServer";
import { Denied } from "@/components/staff/Denied";
import { q } from "@/lib/db";
import { isEphemeralDb } from "@/lib/db";
import { twilioConfigured } from "@/lib/sms";
import { VerifyAudit, ResetDemo } from "@/components/staff/actions";
import { Icon } from "@/components/Icon";
import { MATRIX, ROLE_LABEL, type Role } from "@/lib/rbac";

export default async function Audit() {
  const me = await requireStaffPage();
  if (!allowed(me, "audit.read")) return <Denied what="the audit log" />;
  const rows = await q<{ seq: number; at: string; actor_label: string; action: string; entity: string; entity_id: string | null; hash: string }>("SELECT seq, at, actor_label, action, entity, entity_id, hash FROM audit_log ORDER BY seq DESC LIMIT 150");
  const roles: Role[] = ["counselor", "publisher", "admin"];
  return (
    <>
      <div><h1>Audit and data</h1><p className="muted">Every sign-in, record view, change, message, approval, export and denied access is recorded in an append-only log. Each entry includes a hash of the one before it, so any edit or deletion is detectable.</p></div>
      <section className="panel" aria-labelledby="int">
        <h2 id="int">Audit log integrity</h2>
        <VerifyAudit />
      </section>
      <div className="c-split">
        <section className="wide panel" aria-labelledby="dx">
          <h2 id="dx">Data ownership and exit</h2>
          <p>The WorkPlace owns its data. Download everything in an open format at any time: requests, notes, messages, consent records, content and this log.</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="c-btn primary" href="/api/staff/export" download><Icon name="download" size={16} />Export all data (JSON)</a>
            <a className="c-btn" href="/api/staff/reports" download><Icon name="download" size={16} />Monthly report (CSV)</a>
            <ResetDemo />
          </div>
          <dl className="kv" style={{ maxWidth: 420 }}>
            <dt>Database</dt><dd>{isEphemeralDb() ? "In-memory (preview)" : "Neon Postgres, encrypted at rest"}</dd>
            <dt>Text messaging</dt><dd>{twilioConfigured() ? "Twilio (live)" : "Simulated (no provider keys)"}</dd>
            <dt>Session length</dt><dd>8 hours, revocable</dd>
            <dt>Failed sign-in lockout</dt><dd>5 attempts, 15 minutes</dd>
          </dl>
        </section>
        <section className="side panel" aria-labelledby="rm">
          <h2 id="rm">Role permissions</h2>
          <div className="table-wrap"><table className="t" style={{ minWidth: 360 }}>
            <thead><tr><th scope="col">Permission</th>{roles.map((r) => <th key={r} scope="col">{ROLE_LABEL[r]}</th>)}</tr></thead>
            <tbody>{Object.entries(MATRIX).map(([p, rs]) => <tr key={p}><td>{p}</td>{roles.map((r) => <td key={r} aria-label={rs.includes(r) ? "Allowed" : "Not allowed"} style={{ color: rs.includes(r) ? "var(--green)" : "var(--ink-3)", fontWeight: 800 }}>{rs.includes(r) ? "Yes" : "No"}</td>)}</tr>)}</tbody>
          </table></div>
        </section>
      </div>
      <div className="table-wrap">
        <table className="t">
          <caption className="sr-only">Audit log, newest first</caption>
          <thead><tr><th scope="col">#</th><th scope="col">Time (ET)</th><th scope="col">Who</th><th scope="col">Action</th><th scope="col">Record</th><th scope="col">Hash</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.seq}><td className="small">{r.seq}</td><td className="small" style={{ whiteSpace: "nowrap" }}>{new Date(r.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "America/New_York" })}</td>
              <td>{r.actor_label}</td><td>{r.action}</td><td className="small">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td><td className="small" style={{ fontFamily: "ui-monospace, monospace" }}>{r.hash.slice(0, 10)}…</td></tr>))}</tbody>
        </table>
      </div>
    </>
  );
}
