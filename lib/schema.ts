// Database schema. Idempotent: safe to run on every cold start.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('counselor','publisher','admin')),
  password_hash TEXT NOT NULL,
  token_version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  goals TEXT[] NOT NULL,
  formats TEXT[] NOT NULL,
  towns TEXT[] NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft','review','published')),
  live JSONB,
  draft JSONB NOT NULL,
  submitted_by TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('resident','employer')),
  service_id TEXT,
  first_name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  contact_method TEXT NOT NULL CHECK (contact_method IN ('callback','email','text')),
  best_time TEXT NOT NULL DEFAULT 'any',
  note TEXT,
  need TEXT,
  openings INTEGER,
  language TEXT NOT NULL DEFAULT 'en',
  area TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','review','contacted','closed')),
  assigned_to TEXT REFERENCES staff_users(id),
  sms_consent BOOLEAN NOT NULL DEFAULT FALSE,
  channel TEXT NOT NULL DEFAULT 'app',
  first_action_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS referrals_status_idx ON referrals(status, created_at DESC);
CREATE INDEX IF NOT EXISTS referrals_phone_idx ON referrals(phone);

CREATE TABLE IF NOT EXISTS referral_notes (
  id TEXT PRIMARY KEY,
  referral_id TEXT NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES staff_users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY,
  referral_id TEXT REFERENCES referrals(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'message',
  status TEXT NOT NULL,
  segments INTEGER NOT NULL DEFAULT 1,
  provider_sid TEXT,
  sent_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sms_phone_idx ON sms_messages(phone, created_at);

CREATE TABLE IF NOT EXISTS sms_consent (
  phone TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('opted_in','opted_out')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_events (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  event TEXT NOT NULL CHECK (event IN ('opt_in','opt_out','resubscribe')),
  text_version TEXT,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lang TEXT,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  visitor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS analytics_name_idx ON analytics_events(name, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  seq BIGSERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id TEXT,
  actor_label TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL
);
`;
