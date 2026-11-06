import { requireStaffPage, allowed } from "@/lib/staffServer";
import { Denied } from "@/components/staff/Denied";
import { getReport } from "@/lib/reports";
import { Icon } from "@/components/Icon";
export default async function Reports() {
  const me = await requireStaffPage();
  if (!allowed(me, "reports.read")) return <Denied what="reports" />;
  const r = await getReport(30);
  const max = Math.max(1, ...r.funnel.map(([, v]) => v));
  const maxS = Math.max(1, ...r.byService.map((x) => x.n));
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 10 }}>
        <div><h1>Reports</h1><p className="muted">Adoption, service navigation and follow-through. Analytics are pseudonymous: no names, numbers or IP addresses.</p></div>
        <a href="/api/staff/reports" className="c-btn primary" download><Icon name="download" size={16} />Export monthly report (CSV)</a>
      </div>
      <div className="kpis">
        <div className="kpi"><span className="l">Requests sent, 30 days</span><span className="v">{r.funnel[3][1].toLocaleString()}</span><span className="small">{pct(r.funnel[3][1], r.funnel[2][1])} of requests started were sent</span></div>
        <div className="kpi"><span className="l">Median time to first staff action</span><span className="v">{r.medianFirstActionMin === null ? "—" : r.medianFirstActionMin < 120 ? `${Math.round(r.medianFirstActionMin)} min` : `${(r.medianFirstActionMin / 60).toFixed(1)} h`}</span><span className="small">{r.within2d === null ? "No actions yet" : `${r.within2d}% within 2 days`}</span></div>
        <div className="kpi"><span className="l">Spanish-language requests</span><span className="v">{r.esShare}%</span><span className="small">Of all requests</span></div>
        <div className="kpi"><span className="l">Text consent rate</span><span className="v">{r.consentShare}%</span><span className="small">{r.optouts} opt-out{r.optouts === 1 ? "" : "s"} in 30 days</span></div>
      </div>
      <div className="c-split">
        <section className="wide panel" aria-labelledby="fn">
          <h2 id="fn">Most people who start a request finish it</h2>
          <p className="small">Navigation funnel, last 30 days. Includes sample history for the demonstration.</p>
          {r.funnel.map(([k, v], i) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>{k}</span><strong>{v.toLocaleString()}{i > 0 ? <span className="small" style={{ fontWeight: 400 }}> · {pct(v, r.funnel[i - 1][1])} of previous</span> : null}</strong></div>
              <div className="bar" aria-hidden="true"><span style={{ width: `${(v / max) * 100}%` }} /></div>
            </div>))}
        </section>
        <section className="side panel" aria-labelledby="bs">
          <h2 id="bs">Requests by service</h2>
          {r.byService.map((x) => (
            <div key={x.label} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 90px 28px", gap: 10, alignItems: "center" }}>
              <span>{x.label}</span><div className="bar" aria-hidden="true"><span style={{ width: `${(x.n / maxS) * 100}%`, background: "var(--navy)" }} /></div><strong style={{ textAlign: "right" }}>{x.n}</strong>
            </div>))}
          <p className="small">Text messages, 30 days: {r.sms.out} sent ({r.sms.segs} billable segments), {r.sms.inn} received.</p>
        </section>
      </div>
    </>
  );
}
