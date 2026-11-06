import Link from "next/link";
import { requireStaffPage, allowed } from "@/lib/staffServer";
import { Denied } from "@/components/staff/Denied";
import { ContentEditor } from "@/components/staff/actions";
import { q } from "@/lib/db";
import type { ServiceRow } from "@/lib/services";

const STATE: Record<string, string> = { draft: "Draft", review: "In review", published: "Published" };
export default async function Content({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const me = await requireStaffPage();
  if (!allowed(me, "content.edit")) return <Denied what="content" />;
  const { id } = await searchParams;
  const rows = await q<ServiceRow & { editor: string | null }>("SELECT s.*, u.name editor FROM services s LEFT JOIN staff_users u ON u.id = s.updated_by ORDER BY CASE s.state WHEN 'review' THEN 0 WHEN 'draft' THEN 1 ELSE 2 END, s.id");
  const sel = rows.find((r) => r.id === id) ?? rows[0];
  const esDone = (r: ServiceRow) => ["title", "sum", "who", "how", "bring"].every((k) => String((r.draft.es as Record<string, string>)[k] ?? "").trim());
  return (
    <>
      <div><h1>Content</h1><p className="muted">Bilingual service cards. Edits are drafts until an administrator approves them; the public app only ever shows the approved version.</p></div>
      <div className="c-split">
        <div className="wide table-wrap" style={{ flex: "1 1 420px" }}>
          <table className="t" style={{ minWidth: 480 }}>
            <thead><tr><th scope="col">Service card</th><th scope="col">Spanish</th><th scope="col">Workflow</th><th scope="col">Version</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className={r.id === sel?.id ? "sel" : undefined}>
                <td><Link href={`/staff/content?id=${r.id}`} style={{ fontWeight: 800 }}>{r.draft.en.title || r.id}</Link>{r.live && r.state !== "published" ? <div className="small">Live version stays up until approval</div> : null}</td>
                <td>{esDone(r) ? <span style={{ color: "var(--green)", fontWeight: 700 }}>Complete</span> : <span style={{ color: "var(--red)", fontWeight: 800 }}>Missing</span>}</td>
                <td><span className={`st st-${r.state}`}>{STATE[r.state]}</span></td>
                <td className="small">v{r.version} · {r.editor ?? "—"}</td>
              </tr>))}</tbody>
          </table>
        </div>
        {sel && (
          <section className="side panel" style={{ flex: "999 1 520px", maxWidth: "none" }} aria-label="Edit service card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><h2>Edit: {sel.draft.en.title || sel.id}</h2><span className={`st st-${sel.state}`}>{STATE[sel.state]}</span></div>
            <ContentEditor key={`${sel.id}-${sel.state}-${sel.version}`} id={sel.id} draft={sel.draft} state={sel.state} canEdit={allowed(me, "content.edit")} canApprove={allowed(me, "content.approve")} isSubmitter={sel.submitted_by === me.id} />
          </section>)}
      </div>
    </>
  );
}
