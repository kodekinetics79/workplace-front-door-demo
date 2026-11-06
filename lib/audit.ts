import { sha256 } from "./ids";
import { q } from "./db";

type Query = (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
export type AuditEntry = { actorId: string | null; actorLabel: string; action: string; entity: string; entityId?: string | null; detail?: Record<string, unknown> };

export const GENESIS = "0".repeat(64);

/** Canonical form so the hash does not depend on key order or driver formatting. */
export function canonical(e: { at: string; actorId: string | null; actorLabel: string; action: string; entity: string; entityId: string | null; detail: Record<string, unknown> }) {
  const sortObj = (o: unknown): unknown => Array.isArray(o) ? o.map(sortObj) : o && typeof o === "object" ? Object.fromEntries(Object.keys(o as object).sort().map((k) => [k, sortObj((o as Record<string, unknown>)[k])])) : o;
  return JSON.stringify(sortObj(e));
}
export const chainHash = (prev: string, body: string) => sha256(`${prev}|${body}`);

/** Appends to the tamper-evident (hash-chained) audit log. Never updates or deletes. */
export async function appendAuditWith(query: Query, entry: AuditEntry) {
  const last = await query("SELECT hash FROM audit_log ORDER BY seq DESC LIMIT 1");
  const prev = (last[0]?.hash as string) ?? GENESIS;
  const at = new Date().toISOString();
  const rec = { at, actorId: entry.actorId, actorLabel: entry.actorLabel, action: entry.action, entity: entry.entity, entityId: entry.entityId ?? null, detail: entry.detail ?? {} };
  const hash = chainHash(prev, canonical(rec));
  await query(
    "INSERT INTO audit_log (at, actor_id, actor_label, action, entity, entity_id, detail, prev_hash, hash) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)",
    [at, rec.actorId, rec.actorLabel, rec.action, rec.entity, rec.entityId, JSON.stringify(rec.detail), prev, hash],
  );
  return hash;
}

export const audit = (entry: AuditEntry) => appendAuditWith((t, p) => q(t, p), entry);

type AuditRow = { seq: number; at: string | Date; actor_id: string | null; actor_label: string; action: string; entity: string; entity_id: string | null; detail: Record<string, unknown>; prev_hash: string; hash: string };

/** Recomputes every link. Any edited, inserted or deleted row breaks the chain at that point. */
export async function verifyAuditChain(): Promise<{ ok: boolean; checked: number; brokenAt?: number }> {
  const rows = await q<AuditRow>("SELECT * FROM audit_log ORDER BY seq ASC");
  let prev = GENESIS;
  for (const r of rows) {
    const at = r.at instanceof Date ? r.at.toISOString() : new Date(r.at).toISOString();
    const body = canonical({ at, actorId: r.actor_id, actorLabel: r.actor_label, action: r.action, entity: r.entity, entityId: r.entity_id, detail: r.detail ?? {} });
    if (r.prev_hash !== prev || chainHash(prev, body) !== r.hash) return { ok: false, checked: rows.length, brokenAt: Number(r.seq) };
    prev = r.hash;
  }
  return { ok: true, checked: rows.length };
}
