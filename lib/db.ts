import { SCHEMA_SQL } from "./schema";
import { seed } from "./seed";

export type Row = Record<string, unknown>;
type Runner = { query: (text: string, params?: unknown[]) => Promise<Row[]>; exec: (text: string) => Promise<void> };

let runnerPromise: Promise<Runner> | null = null;
let readyPromise: Promise<void> | null = null;

async function makeRunner(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { Pool } = await import("@neondatabase/serverless");
    const pool = new Pool({ connectionString: url });
    return {
      query: async (text, params = []) => (await pool.query(text, params as unknown[])).rows as Row[],
      exec: async (text) => { await pool.query(text); },
    };
  }
  // Local development, tests and pre-provisioning previews: in-process Postgres (PGlite).
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite();
  return {
    query: async (text, params = []) => (await pg.query(text, params as unknown[])).rows as Row[],
    exec: async (text) => { await pg.exec(text); },
  };
}

export const isEphemeralDb = () => !process.env.DATABASE_URL;

async function runner(): Promise<Runner> {
  if (!runnerPromise) runnerPromise = makeRunner();
  return runnerPromise;
}

async function ready(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const r = await runner();
      await r.exec(SCHEMA_SQL);
      const rows = await r.query("SELECT value FROM app_meta WHERE key = 'seeded'");
      if (!rows.length) await seed(r.query);
    })().catch((e) => { readyPromise = null; throw e; });
  }
  return readyPromise;
}

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await (await runner()).query(text, params)) as T[];
}

export async function q1<T = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await q<T>(text, params);
  return rows[0] ?? null;
}

/** Wipes demo data and re-seeds. Admin-only via API; also used by tests. */
export async function resetDemoData() {
  await ready();
  const r = await runner();
  await r.exec(`DROP TABLE IF EXISTS referral_notes, sms_messages, consent_events, sms_consent, analytics_events, audit_log, rate_limits, referrals, services, staff_users, app_meta CASCADE;`);
  await r.exec(SCHEMA_SQL);
  await seed(r.query);
}

/** Test helper: start a fresh in-process database. */
export function __resetForTests() { runnerPromise = null; readyPromise = null; }
