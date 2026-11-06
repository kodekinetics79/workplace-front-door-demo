import { requireStaffPage, allowed } from "@/lib/staffServer";
import { Queue } from "@/components/staff/Queue";
import { Denied } from "@/components/staff/Denied";
import { redirect } from "next/navigation";
export default async function QueuePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireStaffPage();
  if (!allowed(me, "referrals.read")) { if (allowed(me, "content.edit")) redirect("/staff/content"); return <Denied what="referrals" />; }
  const sp = await searchParams;
  return (<><div><h1>Referral queue</h1><p className="muted">Requests from the app and web. Staff confirm eligibility and the next step.</p></div>
    <Queue me={me} filter={sp.f ?? "open"} selected={sp.id} search={sp.q?.slice(0, 60)} /></>);
}
