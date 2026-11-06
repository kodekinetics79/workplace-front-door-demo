import Link from "next/link";
import { Icon } from "./Icon";
import type { Dict } from "@/lib/i18n";
const GS: Record<string, [string, string]> = { job: ["#E8F0F9", "#1F5FA8"], skills: ["#E6F4EC", "#1E6B43"], help: ["#FFF4DA", "#7A5200"], youth: ["#F1ECFA", "#5B3E99"], employer: ["#E9EEF3", "#12304A"] };
export function GoalList({ t }: { t: Dict }) {
  const goals = [
    { k: "job", href: "/services?goal=job", title: t.g_job, sub: t.g_job_s },
    { k: "skills", href: "/services?goal=skills", title: t.g_skills, sub: t.g_skills_s },
    { k: "help", href: "/services?goal=help", title: t.g_help, sub: t.g_help_s },
    { k: "youth", href: "/youth", title: t.g_youth, sub: t.g_youth_s },
    { k: "employer", href: "/employers", title: t.g_employer, sub: t.g_employer_s },
  ];
  return (
    <div className="card list">
      {goals.map((g) => (
        <Link key={g.k} href={g.href} className="row">
          <span className="tile" style={{ background: `linear-gradient(160deg, #fff -40%, ${GS[g.k][0]} 70%)`, color: GS[g.k][1] }}><Icon name={g.k} /></span>
          <span className="grow"><span className="t">{g.title}</span><span className="s">{g.sub}</span></span>
          <Icon name="chevron" size={20} className="chev" />
        </Link>
      ))}
    </div>
  );
}
