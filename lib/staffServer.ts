import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, staffFromToken, type Staff } from "./auth";
import { can, type Permission } from "./rbac";

export async function currentStaff(): Promise<Staff | null> {
  return staffFromToken((await cookies()).get(SESSION_COOKIE)?.value);
}
export async function requireStaffPage(): Promise<Staff> {
  const s = await currentStaff();
  if (!s) redirect("/staff/login");
  return s;
}
export const allowed = (s: Staff, p: Permission) => can(s.role, p);
