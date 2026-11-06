import { q } from "./db";
import { audit } from "./audit";
/** Applies the proposed retention schedule. Values are WorkPlace-configurable; defaults follow the proposal. */
export async function applyRetention(days = { messages: Number(process.env.RETAIN_MESSAGE_DAYS || 90), analytics: Number(process.env.RETAIN_ANALYTICS_DAYS || 365), closedReferrals: Number(process.env.RETAIN_REFERRAL_DAYS || 365) }) {
  const m = await q("UPDATE sms_messages SET body = '[removed under retention policy]', purged = TRUE WHERE purged = FALSE AND created_at < now() - make_interval(days => $1) RETURNING id", [days.messages]);
  const a = await q("DELETE FROM analytics_events WHERE created_at < now() - make_interval(days => $1) RETURNING id", [days.analytics]);
  const r = await q(`UPDATE referrals SET first_name = 'Removed', phone = NULL, email = NULL, note = NULL, referrer_name = NULL, referrer_email = NULL
    WHERE status = 'closed' AND first_name <> 'Removed' AND updated_at < now() - make_interval(days => $1) RETURNING id`, [days.closedReferrals]);
  const result = { messageBodiesRemoved: m.length, analyticsDeleted: a.length, referralsDeidentified: r.length };
  await audit({ actorId: null, actorLabel: "System", action: "Retention schedule applied", entity: "retention", detail: result });
  return result;
}
