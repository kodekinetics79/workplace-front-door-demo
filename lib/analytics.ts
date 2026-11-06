import { q } from "./db";
export const ALLOWED_EVENTS = ["session_start", "service_view", "search", "request_start", "request_submit", "save_service", "track_lookup", "language_switch", "calendar_add", "listen"] as const;
export type EventName = (typeof ALLOWED_EVENTS)[number];
/** Pseudonymous product analytics: event name, language and coarse props only. No PII, no IP. */
export async function track(name: EventName, lang: string, visitor: string | null, props: Record<string, string | number | boolean> = {}) {
  await q("INSERT INTO analytics_events (name, lang, props, visitor) VALUES ($1,$2,$3::jsonb,$4)", [name, lang === "es" ? "es" : "en", JSON.stringify(props), visitor]);
}
