import { handle } from "@/lib/http";
import { requirePermission } from "@/lib/auth";
import { q } from "@/lib/db";
import { audit } from "@/lib/audit";
export const runtime = "nodejs";
// Data ownership and exit: everything The WorkPlace owns, in an open format, in one download. Password hashes are excluded.
export const GET = handle(async (req) => {
  const me = await requirePermission(req, "data.export");
  const [referrals, notes, sms, consent, consentEvents, services, staff, auditLog] = await Promise.all([
    q("SELECT * FROM referrals ORDER BY created_at"), q("SELECT * FROM referral_notes ORDER BY created_at"), q("SELECT * FROM sms_messages ORDER BY created_at"),
    q("SELECT * FROM sms_consent"), q("SELECT * FROM consent_events ORDER BY created_at"), q("SELECT * FROM services ORDER BY id"),
    q("SELECT id, email, name, role, active, last_login_at, created_at FROM staff_users ORDER BY id"), q("SELECT * FROM audit_log ORDER BY seq"),
  ]);
  await audit({ actorId: me.id, actorLabel: me.name, action: "Exported all data (JSON)", entity: "export", detail: { referrals: referrals.length } });
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), format: "workplace-front-door-export/v1", referrals, referralNotes: notes, smsMessages: sms, smsConsent: consent, consentEvents, services, staff, auditLog }, null, 2);
  return new Response(body, { headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="workplace-export-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "no-store" } });
});
