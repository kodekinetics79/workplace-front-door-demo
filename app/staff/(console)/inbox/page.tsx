import { requireStaffPage, allowed } from "@/lib/staffServer";
import { Queue } from "@/components/staff/Queue";
import { Denied } from "@/components/staff/Denied";
export default async function Inbox({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaffPage();
  if (!allowed(me, "referrals.read")) return <Denied what="the text inbox" />;
  const sp = await searchParams;
  return (<><div><h1>Text inbox</h1><p className="muted">Two-way conversations. STOP, START and HELP are handled automatically; replies of C or R are logged on the case.</p></div>
    <Queue me={me} filter="all" selected={sp.id} search={sp.q?.slice(0, 60)} inbox /></>);
}
