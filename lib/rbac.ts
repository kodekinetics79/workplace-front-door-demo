export type Role = "counselor" | "publisher" | "admin";
export type Permission =
  | "referrals.read" | "referrals.write" | "sms.send"
  | "content.edit" | "content.approve"
  | "reports.read" | "audit.read" | "data.export" | "demo.reset";

/** Single source of truth for authorization. Enforced on the server for every staff API call. */
export const MATRIX: Record<Permission, Role[]> = {
  "referrals.read": ["counselor", "admin"],
  "referrals.write": ["counselor", "admin"],
  "sms.send": ["counselor", "admin"],
  "content.edit": ["publisher", "admin"],
  "content.approve": ["admin"],
  "reports.read": ["admin"],
  "audit.read": ["admin"],
  "data.export": ["admin"],
  "demo.reset": ["admin"],
};
export const can = (role: Role | null | undefined, p: Permission) => !!role && MATRIX[p].includes(role);
export const ROLE_LABEL: Record<Role, string> = { counselor: "Counselor", publisher: "Content publisher", admin: "Administrator" };
