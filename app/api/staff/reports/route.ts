import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { getReport } from "@/lib/reports";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
const cell = (v: unknown) => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? `'${s}` : /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }; // blocks CSV formula injection
export const GET = handle(async (req) => {
  const me = await requirePermission(req, "reports.read");
  const r = await getReport(30);
  const lines = [["Section", "Measure", "Value"], ...r.funnel.map(([k, v]) => ["Navigation funnel (30 days)", k, v]), ...r.byService.map((x) => ["Referrals by service", x.label, x.n]),
    ...r.byStatus.map((x) => ["Referrals by status", x.status, x.n]), ["Language", "Spanish-language requests (%)", r.esShare], ["SMS", "Consent rate where phone given (%)", r.consentShare],
    ["SMS", "Outbound messages (30 days)", r.sms.out], ["SMS", "Outbound segments (30 days)", r.sms.segs], ["SMS", "Inbound messages (30 days)", r.sms.inn], ["SMS", "Opt-outs (30 days)", r.optouts],
    ["Follow-through", "Median minutes to first staff action", r.medianFirstActionMin === null ? "" : Math.round(r.medianFirstActionMin)], ["Follow-through", "First action within 2 days (%)", r.within2d ?? ""]];
  await audit({ actorId: me.id, actorLabel: me.name, action: "Exported monthly report (CSV)", entity: "report" });
  return new Response(lines.map((l) => l.map(cell).join(",")).join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="workplace-report-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" } });
});
