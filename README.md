# The WorkPlace Digital Front Door — demonstration environment

Built by Kode Kinetics LLC for The WorkPlace Mobile App and Digital Workforce Front Door RFP (November 2026).
**Demonstration only: sample data, no real WorkPlace systems or personal data.**

## What it is
- **Resident and employer web app** (mobile-first, installable): bilingual English/Spanish, goal-based discovery, search, town and format filters, service detail with read-aloud, save to device, "Ask for help" with no account, request tracking by reference number, youth pathway with calendar (.ics) export, employer inquiry, display settings (text size, high contrast), privacy and accessibility statements.
- **Staff console**: server-enforced roles (Counselor, Content publisher, Administrator), referral queue with status/assignment/notes, two-way SMS inbox with approved templates and segment counter, bilingual content workflow (draft → review → publish, two-person rule, Spanish required), reports with CSV export, tamper-evident hash-chained audit log with integrity check, full data export (JSON), demo reset.
- **Inclusion and channels**: interpreter request (Spanish, Portuguese, Haitian Creole, Polish, ASL, other) and 711 relay guidance; partner referral journey (agency staff refer a resident with consent); lobby kiosk mode (`/kiosk`, auto-clears after 90 s idle, QR hand-off to a phone); offline outbox (requests made with no signal are held on the device and sent when it reconnects); nearest office by location (opt-in); duplicate-request flag; equity report (completion by language, flagged when 10+ points below overall).
- **Native app shell** (`mobile/`, Expo / React Native): imports the same language and content core (`lib/i18n.ts`, `lib/content.ts`) and calls the same API — proof that iOS, Android and web share one codebase.
- **Two-way SMS** through Twilio: consent captured and versioned, confirmation text, STOP/START/HELP handling, C/R replies logged, sensitive-content blocking, signature-verified webhook, delivery-status callbacks, idempotent inbound handling, automatic retry (3 attempts, consent re-checked), SMS-pumping caps, retention purge (90 days). Without Twilio keys, messages are simulated and visible in the console.

## Stack
Next.js 15 (App Router, TypeScript), Postgres (Neon; in-process PGlite fallback for local/test), jose (HS256 sessions, revocable), bcrypt, zod validation, Vitest.

## Run locally
```
npm install
ALLOW_EPHEMERAL_DB=1 ALLOW_DEV_SECRET=1 npm run dev   # http://localhost:3000 — in-memory Postgres; no setup
npm test           # 22 tests: intake, consent, STOP/START/HELP, RBAC, sessions, lockout, rate limit, audit chain, reports
npm run typecheck && npm run lint && npm run build
```

## Deploy to Vercel
1. Import the repository (or run `npx vercel --prod` in this folder).
2. Vercel → project → Storage → Create Database → **Neon** → connect to the project (sets `DATABASE_URL`).
3. Add `SESSION_SECRET` and `CRON_SECRET` (32+ random characters each), `DEMO_MODE=1` and `PUBLIC_BASE_URL`. Redeploy. The app refuses to start in production without a database or a strong secret.
4. Optional SMS: add the `TWILIO_*` variables, then in Twilio set the number's "A message comes in" webhook to `https://<your-domain>/api/sms/inbound` (HTTP POST). Delivery receipts post to `/api/sms/status` automatically.
5. Check `https://<your-domain>/api/health` → `dbMode: "neon"`, `sms: "twilio"` or `"simulated"`.

Schema and sample data are created automatically on first request.

## Demo accounts (shown on /staff/login)
| Role | Email | Password |
|---|---|---|
| Counselor | counselor@demo.workplace | Counselor-Demo-2026 |
| Content publisher | publisher@demo.workplace | Publisher-Demo-2026 |
| Administrator | admin@demo.workplace | Admin-Demo-2026 |

Every account uses a second factor (TOTP, RFC 6238). With `DEMO_MODE=1` the sign-in screen offers **Show the current demo code** for these demo accounts only. Production replaces this with The WorkPlace's Microsoft Entra ID single sign-on and conditional-access MFA.

## Security controls in this build
Server-side permission checks on every staff API and page; same-origin check on cookie-authenticated mutations; HttpOnly SameSite session cookies (8 h, revocable via token version); TOTP multi-factor sign-in; account lockout after 5 failed sign-ins; fail-closed start-up (no database or weak secret in production = no start); Postgres-backed rate limits on public forms, tracking and login; honeypot field; input validation and size limits; CSV formula-injection protection; security headers (HSTS, frame denial, nosniff, referrer and permissions policies); pseudonymous analytics (salted hashes, no IP or PII); PII masked in the console; access to each referral is audit-logged.

Scheduled jobs (`vercel.json`): SMS retry every 15 minutes; retention daily (messages 90 days, analytics 365 days, closed referrals de-identified after 365 days). Both require `CRON_SECRET`.

## Verify it yourself
| Claim in the proposal | Where to check |
|---|---|
| Server-enforced roles | `lib/rbac.ts`, `lib/auth.ts` → `requirePermission`; test "RBAC" |
| Consent before any text | `lib/sms.ts` → `sendSms`; tests "consent", "STOP/START/HELP" |
| Tamper-evident audit | `lib/audit.ts`; Staff → Audit → Verify chain |
| MFA | `lib/totp.ts` (RFC 6238 test vector); `/api/auth/mfa` |
| Two-person publishing, Spanish required | `/api/staff/services/[id]/transition` |
| Retention | `lib/retention.ts`, `/api/cron/retention` |
| One codebase for web and native | `mobile/App.tsx` imports `../lib/i18n` |
| Equity reporting | `lib/reports.ts` → `equity`; Staff → Reports |
