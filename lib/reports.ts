import { q, q1 } from "./db";
export async function getReport(days = 30) {
  const funnelRows = await q<{ name: string; n: number }>(`SELECT name, count(*)::int n FROM analytics_events WHERE created_at > now() - make_interval(days => $1) AND name IN ('session_start','service_view','request_start','request_submit') GROUP BY name`, [days]);
  const f = Object.fromEntries(funnelRows.map((r) => [r.name, r.n]));
  const byService = await q<{ label: string; n: number }>(`SELECT COALESCE(s.live->'en'->>'title', CASE WHEN r.kind='employer' THEN 'Employer inquiries' ELSE 'General career help' END) label, count(*)::int n FROM referrals r LEFT JOIN services s ON s.id = r.service_id GROUP BY 1 ORDER BY n DESC`);
  const byStatus = await q<{ status: string; n: number }>("SELECT status, count(*)::int n FROM referrals GROUP BY status");
  const lang = await q1<{ es: number; total: number }>("SELECT count(*) FILTER (WHERE language='es')::int es, count(*)::int total FROM referrals");
  const consent = await q1<{ yes: number; total: number }>("SELECT count(*) FILTER (WHERE sms_consent)::int yes, count(*) FILTER (WHERE contact_method <> 'email')::int total FROM referrals");
  const optouts = await q1<{ n: number }>("SELECT count(*)::int n FROM consent_events WHERE event = 'opt_out' AND created_at > now() - make_interval(days => $1)", [days]);
  const sms = await q1<{ out: number; segs: number; inn: number }>("SELECT count(*) FILTER (WHERE direction='out')::int out, COALESCE(sum(segments) FILTER (WHERE direction='out'),0)::int segs, count(*) FILTER (WHERE direction='in')::int inn FROM sms_messages WHERE created_at > now() - make_interval(days => $1)", [days]);
  const speed = await q1<{ median_min: number | null; within_2d: number; acted: number }>(`SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM first_action_at - created_at)/60)::float median_min,
    count(*) FILTER (WHERE first_action_at - created_at <= interval '2 days')::int within_2d, count(first_action_at)::int acted FROM referrals WHERE first_action_at IS NOT NULL`);
  const eq = await q<{ lang: string; started: number; sent: number }>(`SELECT lang, count(*) FILTER (WHERE name='request_start')::int started, count(*) FILTER (WHERE name='request_submit')::int sent
    FROM analytics_events WHERE created_at > now() - make_interval(days => $1) AND name IN ('request_start','request_submit') GROUP BY lang ORDER BY lang`, [days]);
  const tot = eq.reduce((a, r) => ({ s: a.s + r.started, d: a.d + r.sent }), { s: 0, d: 0 });
  const overall = tot.s ? Math.round((tot.d / tot.s) * 100) : 0;
  const equity = eq.map((r) => { const rate = r.started ? Math.round((r.sent / r.started) * 100) : 0; return { group: r.lang === "es" ? "Spanish" : "English", started: r.started, sent: r.sent, rate, flag: rate <= overall - 10 }; });
  const channels = await q<{ channel: string; n: number }>("SELECT channel, count(*)::int n FROM referrals GROUP BY channel ORDER BY n DESC");
  return {
    equity, overall, channels,
    funnel: [["App and web sessions", f.session_start ?? 0], ["Service cards viewed", f.service_view ?? 0], ["Help requests started", f.request_start ?? 0], ["Requests sent", f.request_submit ?? 0]] as [string, number][],
    byService, byStatus, esShare: lang?.total ? Math.round((lang.es / lang.total) * 100) : 0, consentShare: consent?.total ? Math.round((consent.yes / consent.total) * 100) : 0,
    optouts: optouts?.n ?? 0, sms: sms ?? { out: 0, segs: 0, inn: 0 }, medianFirstActionMin: speed?.median_min ?? null, within2d: speed?.acted ? Math.round((speed.within_2d / speed.acted) * 100) : null,
  };
}
