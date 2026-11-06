import Link from "next/link";
import { q, q1 } from "@/lib/db";
import { maskPhone } from "@/lib/sms";
import { ReferralControls, SmsComposer, SimulateInbound, NoteForm } from "./actions";
import type { Staff } from "@/lib/auth";
import { audit } from "@/lib/audit";

type R = { id: string; ref: string; kind: string; first_name: string; company: string | null; phone: string | null; email: string | null; contact_method: string; best_time: string; note: string | null; language: string; area: string | null; status: string; assigned_to: string | null; sms_consent: boolean; created_at: string; title: string | null; assignee: string | null; consent: string | null; last_in: string | null };
const ST: Record<string, string> = { new: "New", review: "Staff review", contacted: "Contacted", closed: "Closed" };
const AREA: Record<string, string> = { bridgeport: "Bridgeport", stamford: "Stamford", valley: "Lower Naugatuck Valley", online: "Online" };
const TIME: Record<string, string> = { any: "Any time", am: "Mornings", pm: "Afternoons" };
const age = (d: string) => { const m = Math.round((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };

export async function Queue({ me, filter, selected, search, inbox }: { me: Staff; filter: string; selected?: string; search?: string; inbox?: boolean }) {
  const where: string[] = []; const params: unknown[] = [];
  if (inbox) where.push("EXISTS (SELECT 1 FROM sms_messages m WHERE m.referral_id = r.id)");
  else if (filter === "open") where.push("r.status <> 'closed'");
  else if (filter === "mine") { params.push(me.id); where.push(`r.assigned_to = $${params.length} AND r.status <> 'closed'`); }
  else if (["new", "review", "contacted", "closed"].includes(filter)) { params.push(filter); where.push(`r.status = $${params.length}`); }
  if (search) { params.push(`%${search.toLowerCase()}%`); where.push(`(lower(r.first_name) LIKE $${params.length} OR lower(r.ref) LIKE $${params.length} OR lower(coalesce(r.company,'')) LIKE $${params.length})`); }
  const rows = await q<R>(`SELECT r.*, s.live->'en'->>'title' title, u.name assignee, c.status consent,
      (SELECT body FROM sms_messages m WHERE m.referral_id = r.id AND m.direction='in' ORDER BY created_at DESC LIMIT 1) last_in
    FROM referrals r LEFT JOIN services s ON s.id = r.service_id LEFT JOIN staff_users u ON u.id = r.assigned_to LEFT JOIN sms_consent c ON c.phone = r.phone
    ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY CASE r.status WHEN 'new' THEN 0 WHEN 'review' THEN 1 WHEN 'contacted' THEN 2 ELSE 3 END, r.created_at DESC LIMIT 200`, params);
  const kpi = await q1<{ new: number; unassigned: number; overdue: number; optouts: number }>(`SELECT count(*) FILTER (WHERE status='new')::int new, count(*) FILTER (WHERE assigned_to IS NULL AND status <> 'closed')::int unassigned,
    count(*) FILTER (WHERE first_action_at IS NULL AND created_at < now() - interval '2 days')::int overdue, (SELECT count(*) FROM sms_consent WHERE status='opted_out')::int optouts FROM referrals`);
  const sel = rows.find((r) => r.id === selected) ?? rows[0];
  const staff = await q<{ id: string; name: string }>("SELECT id, name FROM staff_users WHERE active AND role IN ('counselor','admin') ORDER BY name");
  let thread: { direction: string; body: string; status: string; kind: string; segments: number; created_at: string; sender: string | null }[] = [];
  let notes: { body: string; created_at: string; author: string }[] = [];
  if (sel) {
    thread = await q(`SELECT m.direction, m.body, m.status, m.kind, m.segments, m.created_at, u.name sender FROM sms_messages m LEFT JOIN staff_users u ON u.id = m.sent_by WHERE m.referral_id = $1 ORDER BY m.created_at`, [sel.id]);
    notes = await q(`SELECT n.body, n.created_at, u.name author FROM referral_notes n JOIN staff_users u ON u.id = n.author_id WHERE n.referral_id = $1 ORDER BY n.created_at DESC`, [sel.id]);
    await audit({ actorId: me.id, actorLabel: me.name, action: "Viewed referral", entity: "referral", entityId: sel.id, detail: { ref: sel.ref } });
  }
  const idx = sel ? { new: 1, review: 2, contacted: 3, closed: 4 }[sel.status as "new"] : 0;
  const route = ["Received", "Staff review", "Contacted", "Closed"];
  const base = inbox ? "/staff/inbox" : "/staff";
  const qs = (p: Record<string, string>) => { const u = new URLSearchParams({ ...(filter && !inbox ? { f: filter } : {}), ...(search ? { q: search } : {}), ...p }); return `${base}?${u}`; };
  const canText = !!sel?.phone && sel.consent === "opted_in";
  const reason = !sel?.phone ? "No mobile number on this request. Contact by email or phone." : sel.consent === "opted_out" ? "This person replied STOP. Texting is blocked in the messaging provider and in the application until they reply START. Contact them another way." : "No text consent on file, so texting is blocked. Contact them another way.";
  return (
    <>
      <div className="kpis">
        <div className="kpi"><span className="l">New requests</span><span className="v">{kpi?.new ?? 0}</span><span className="small">Waiting for first review</span></div>
        <div className="kpi"><span className="l">Unassigned</span><span className="v" style={{ color: kpi?.unassigned ? "var(--orange)" : undefined }}>{kpi?.unassigned ?? 0}</span><span className="small">{kpi?.unassigned ? "Needs an owner today" : "All have an owner"}</span></div>
        <div className="kpi"><span className="l">No action after 2 days</span><span className="v" style={{ color: kpi?.overdue ? "var(--red)" : undefined }}>{kpi?.overdue ?? 0}</span><span className="small">Service standard check</span></div>
        <div className="kpi"><span className="l">Texting opt-outs</span><span className="v">{kpi?.optouts ?? 0}</span><span className="small">Suppressed automatically</span></div>
      </div>
      <div className="c-split">
        <div className="wide" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
            {!inbox && <nav className="pills" aria-label="Filter referrals">{[["open", "Open"], ["mine", "Assigned to me"], ["new", "New"], ["review", "Staff review"], ["contacted", "Contacted"], ["closed", "Closed"], ["all", "All"]].map(([k, l]) => <Link key={k} href={`/staff?f=${k}${search ? `&q=${encodeURIComponent(search)}` : ""}`} aria-current={filter === k ? "true" : undefined}>{l}</Link>)}</nav>}
            <form method="get" action={base} role="search" style={{ display: "flex", gap: 6 }}>
              {!inbox && <input type="hidden" name="f" value={filter} />}
              <label htmlFor="qq" className="sr-only">Search name, company or reference</label>
              <input id="qq" name="q" defaultValue={search} placeholder="Search name or reference" className="c-input" style={{ width: 220 }} />
              <button className="c-btn">Search</button>
            </form>
          </div>
          <div className="table-wrap">
            <table className="t">
              <caption className="sr-only">Referrals</caption>
              <thead><tr><th scope="col">Reference</th><th scope="col">Person</th><th scope="col">Service</th><th scope="col">Contact</th><th scope="col">Waiting</th><th scope="col">Status</th><th scope="col">Owner</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.id === sel?.id ? "sel" : undefined}>
                    <td style={{ whiteSpace: "nowrap" }}><Link href={qs({ id: r.id })} style={{ fontWeight: 800 }} aria-current={r.id === sel?.id ? "true" : undefined}>{r.ref}</Link></td>
                    <td>{r.first_name}{r.company ? <span className="small"> · {r.company}</span> : null}{r.language === "es" ? <span className="tag" style={{ marginLeft: 6, padding: "1px 6px" }} title="Spanish">ES</span> : null}</td>
                    <td>{r.kind === "employer" ? "Employer inquiry" : r.title ?? "General career help"}</td>
                    <td>{r.contact_method === "callback" ? "Callback" : r.contact_method === "text" ? "Text" : "Email"}{inbox && r.last_in ? <div className="small" style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{r.last_in}”</div> : null}</td>
                    <td className="small">{age(r.created_at)}</td>
                    <td><span className={`st st-${r.status}`}>{ST[r.status]}</span></td>
                    <td className="small">{r.assignee ?? "Unassigned"}</td>
                  </tr>))}
              </tbody>
            </table>
            {!rows.length && <p style={{ padding: 20 }} className="muted">No referrals match this view.</p>}
          </div>
        </div>
        {sel && (
          <aside className="side panel" aria-label={`Referral ${sel.ref}`}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
              <div><div className="small" style={{ fontWeight: 700 }}>{sel.ref}</div><h2>{sel.first_name}{sel.company ? `, ${sel.company}` : ""}</h2><div className="small">{sel.kind === "employer" ? "Employer inquiry" : sel.title ?? "General career help"} · {sel.area ? AREA[sel.area] : "Area not given"} · {sel.language === "es" ? "Spanish" : "English"}</div></div>
              <span className={`st st-${sel.status}`}>{ST[sel.status]}</span>
            </div>
            <ol className="mini-route" aria-label="Progress">
              {route.map((lb, i) => (
                <li key={lb} aria-current={i === idx ? "step" : undefined}>
                  {i > 0 && <span className={`ln ${i <= idx ? "on" : ""}`} style={{ left: 0, right: "50%" }} aria-hidden="true" />}
                  {i < 3 && <span className={`ln ${i < idx ? "on" : ""}`} style={{ left: "50%", right: 0 }} aria-hidden="true" />}
                  <span className={`d ${i < idx ? "done" : i === idx ? "now" : ""}`} aria-hidden="true" />
                  <span style={{ fontWeight: i === idx ? 800 : 600 }}>{lb}</span>
                </li>))}
            </ol>
            <ReferralControls id={sel.id} status={sel.status} assigned={sel.assigned_to} staff={staff} />
            <dl className="kv">
              <dt>Preferred contact</dt><dd>{sel.contact_method === "callback" ? "Callback" : sel.contact_method === "text" ? "Text" : "Email"}</dd>
              {sel.phone && (<><dt>Phone</dt><dd>{maskPhone(sel.phone)}</dd></>)}
              {sel.email && (<><dt>Email</dt><dd>{sel.email}</dd></>)}
              <dt>Best time</dt><dd>{TIME[sel.best_time] ?? sel.best_time}</dd>
              <dt>Text consent</dt><dd style={{ color: sel.consent === "opted_in" ? "var(--green)" : sel.consent === "opted_out" ? "var(--red)" : undefined }}>{sel.consent === "opted_in" ? "Opted in" : sel.consent === "opted_out" ? "Opted out (STOP)" : "Not given"}</dd>
              <dt>Received</dt><dd>{new Date(sel.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })}</dd>
            </dl>
            {sel.note && <p style={{ background: "var(--ground)", borderRadius: 10, padding: 10 }}>{sel.note}</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800 }}>Text messages</h3>
              <div className="thread">
                {thread.length ? thread.map((m, i) => (
                  <div key={i} className={m.direction === "in" ? "bubble-in" : "bubble-out"} style={{ fontSize: ".875rem" }}>
                    {m.body}<div className="meta">{m.direction === "in" ? "Received" : m.sender ?? (m.kind === "confirmation" ? "Auto-confirmation" : m.kind === "opt_out_confirmation" ? "Opt-out confirmation" : "Automatic reply")} · {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} · {m.status}{m.direction === "out" ? ` · ${m.segments} seg` : ""}</div>
                  </div>)) : <p className="small">No messages yet.</p>}
              </div>
              <SmsComposer id={sel.id} canText={canText} reason={reason} firstName={sel.first_name} lang={sel.language} />
              {sel.phone && <SimulateInbound id={sel.id} />}
            </div>
            <NoteForm id={sel.id} />
            {notes.map((n, i) => <p key={i} className="small" style={{ borderTop: "1px solid var(--line-2)", paddingTop: 6 }}><strong>{n.author}</strong> · {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })}<br />{n.body}</p>)}
          </aside>)}
      </div>
    </>
  );
}
