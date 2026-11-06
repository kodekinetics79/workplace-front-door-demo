# The WorkPlace Digital Front Door — demonstration environment

Built by Kode Kinetics LLC for The WorkPlace Mobile App and Digital Workforce Front Door RFP (November 2026).
**Demonstration only: sample data, no real WorkPlace systems or personal data.**

## What it is
- **Resident and employer web app** (mobile-first, installable): bilingual English/Spanish, goal-based discovery, search, town and format filters, service detail with read-aloud, save to device, "Ask for help" with no account, request tracking by reference number, youth pathway with calendar (.ics) export, employer inquiry, display settings (text size, high contrast), privacy and accessibility statements.
- **Staff console**: server-enforced roles (Counselor, Content publisher, Administrator), referral queue with status/assignment/notes, two-way SMS inbox with approved templates and segment counter, bilingual content workflow (draft → review → publish, two-person rule, Spanish required), reports with CSV export, tamper-evident hash-chained audit log with integrity check, full data export (JSON), demo reset.
- **Two-way SMS** through Twilio: consent captured and versioned, confirmation text, STOP/START/HELP handling, C/R replies logged, sensitive-content blocking, signature-verified webhook. Without Twilio keys, messages are simulated and visible in the console.

## Stack
Next.js 15 (App Router, TypeScript), Postgres (Neon; in-process PGlite fallback for local/test), jose (HS256 sessions, revocable), bcrypt, zod validation, Vitest.

## Run locally
```
npm install
npm run dev        # http://localhost:3000 — uses an in-memory Postgres; no setup needed
npm test           # 18 tests: intake, consent, STOP/START/HELP, RBAC, sessions, lockout, rate limit, audit chain, reports
npm run typecheck && npm run lint && npm run build
```

## Deploy to Vercel
1. Import the repository (or run `npx vercel --prod` in this folder).
2. Vercel → project → Storage → Create Database → **Neon** → connect to the project (sets `DATABASE_URL`).
3. Add `SESSION_SECRET` (32+ random characters). Redeploy.
4. Optional SMS: add the `TWILIO_*` variables, then in Twilio set the number's "A message comes in" webhook to `https://<your-domain>/api/sms/inbound` (HTTP POST).
5. Check `https://<your-domain>/api/health` → `dbMode: "neon"`, `sms: "twilio"` or `"simulated"`.

Schema and sample data are created automatically on first request.

## Demo accounts (shown on /staff/login)
| Role | Email | Password |
|---|---|---|
| Counselor | counselor@demo.workplace | Counselor-Demo-2026 |
| Content publisher | publisher@demo.workplace | Publisher-Demo-2026 |
| Administrator | admin@demo.workplace | Admin-Demo-2026 |

Production would replace these with The WorkPlace's single sign-on and MFA.

## Security controls in this build
Server-side permission checks on every staff API and page; same-origin check on cookie-authenticated mutations; HttpOnly SameSite session cookies (8 h, revocable via token version); account lockout after 5 failed sign-ins; Postgres-backed rate limits on public forms, tracking and login; honeypot field; input validation and size limits; CSV formula-injection protection; security headers (HSTS, frame denial, nosniff, referrer and permissions policies); pseudonymous analytics (salted hashes, no IP or PII); PII masked in the console; access to each referral is audit-logged.
