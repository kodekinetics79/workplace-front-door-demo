import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mark } from "@/components/Icon";
import { LoginForm } from "@/components/staff/actions";
import { DEMO_ACCOUNTS } from "@/lib/seed";
import { currentStaff } from "@/lib/staffServer";
import { ROLE_LABEL } from "@/lib/rbac";

export const metadata: Metadata = { title: "Staff sign in" };
export const dynamic = "force-dynamic";
export default async function Login() {
  if (await currentStaff()) redirect("/staff");
  const accounts = DEMO_ACCOUNTS.filter((a) => a.id !== "u_counselor2").map((a) => ({ email: a.email, password: a.password, name: a.name, role: ROLE_LABEL[a.role] }));
  return (
    <div className="login-wrap">
      <span aria-hidden="true" style={{ position: "absolute", width: 520, height: 520, right: -140, top: -160, borderRadius: "50%", background: "#F2B233", opacity: .2, filter: "blur(60px)" }} />
      <main className="card" style={{ position: "relative", width: "min(440px, 100%)", padding: 28, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 40px 80px -30px rgba(0,0,0,.6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Mark size={34} /><div><div style={{ fontWeight: 800, fontSize: "1.125rem" }}>The WorkPlace</div><div className="small">Staff console (demonstration)</div></div></div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Sign in</h1>
        <LoginForm accounts={accounts} demoMode={process.env.DEMO_MODE === "1" || process.env.NODE_ENV !== "production"} />
      </main>
    </div>
  );
}
