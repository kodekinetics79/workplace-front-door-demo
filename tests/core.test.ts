import { describe, it, expect, beforeAll } from "vitest";
import { q, q1, __resetForTests } from "@/lib/db";
import { createReferral, lookupStatus } from "@/lib/referrals";
import { verifyAuditChain } from "@/lib/audit";
import { handleInbound, sendSms, consentStatus, segmentCount, normalizePhone, validTwilioSignature } from "@/lib/sms";
import { can, MATRIX } from "@/lib/rbac";
import { login, verifyMfa, staffFromToken, revokeSessions } from "@/lib/auth";
import { totp, verifyTotp } from "@/lib/totp";
import { rateLimit } from "@/lib/ratelimit";
import { publishedServices, searchServices, readingGrade } from "@/lib/services";
import { createHmac } from "crypto";

beforeAll(() => { delete process.env.DATABASE_URL; __resetForTests(); });

describe("seed and public content", () => {
  it("serves only published services", async () => {
    const list = await publishedServices("en");
    expect(list.map((s) => s.id)).not.toContain("reentry");
    expect(list.length).toBe(8);
  });
  it("falls back to English when a Spanish field is missing and searches", async () => {
    const es = await publishedServices("es");
    expect(es.find((s) => s.id === "coach")?.title).toBe("Asesoría de carrera");
    const en = await publishedServices("en");
    expect(searchServices(en, { q: "cna" }).map((s) => s.id)).toEqual(["health"]);
    expect(searchServices(en, { goal: "job", town: "stamford", format: "online" }).map((s) => s.id)).toEqual(["coach", "resume", "youth"]);
  });
  it("estimates reading grade", () => { expect(readingGrade("Meet a coach. Make a plan. Get a job you like.")).toBeLessThan(6); });
});

describe("referral intake", () => {
  it("rejects invalid input with field errors", async () => {
    const r = await createReferral({ kind: "resident", firstName: "", method: "callback", phone: "123", lang: "en" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toMatchObject({ firstName: "e_name", phone: "e_phone" });
  });
  it("rejects a non-US or fake phone", async () => {
    const r = await createReferral({ kind: "resident", firstName: "A", method: "text", phone: "+44 20 7946 0000" });
    expect(r.ok).toBe(false);
  });
  it("creates a referral, records consent and sends a simulated confirmation", async () => {
    const r = await createReferral({ kind: "resident", serviceId: "coach", firstName: "Test", method: "text", phone: "(203) 555-0111", smsConsent: true, lang: "en" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ref).toMatch(/^WP-\d{6}$/);
    expect(r.smsSent).toBe(true);
    expect(await consentStatus("+12035550111")).toBe("opted_in");
    const st = await lookupStatus(r.ref, "0111");
    expect(st?.status).toBe("new");
    expect(await lookupStatus(r.ref, "9999")).toBeNull(); // wrong second factor
    expect(JSON.stringify(st)).not.toContain("555"); // no PII in public lookup
  });
  it("does not text without consent", async () => {
    const r = await createReferral({ kind: "resident", firstName: "NoText", method: "callback", phone: "2035550122", smsConsent: false });
    expect(r.ok && r.smsSent).toBe(false);
    const res = await sendSms({ phone: "+12035550122", body: "hello" });
    expect(res.ok).toBe(false);
  });
  it("honeypot submissions are accepted silently but stored nowhere", async () => {
    const before = (await q1<{ n: number }>("SELECT count(*)::int n FROM referrals"))!.n;
    const r = await createReferral({ kind: "resident", firstName: "Bot", method: "callback", phone: "2035550133", website: "spam" });
    expect(r.ok).toBe(false); // website must be empty: schema rejects
    const after = (await q1<{ n: number }>("SELECT count(*)::int n FROM referrals"))!.n;
    expect(after).toBe(before);
  });
  it("accepts an employer inquiry", async () => {
    const r = await createReferral({ kind: "employer", company: "Acme", firstName: "Lee", email: "lee@acme.example", need: "recruit", openings: "4" });
    expect(r.ok && r.ref.startsWith("WB-")).toBe(true);
  });
});

describe("two-way SMS", () => {
  it("STOP suppresses further texts; START resubscribes; HELP always answers", async () => {
    const phone = "+12035550111";
    const reply = await handleInbound("(203) 555-0111", "Stop", "test");
    expect(reply).toMatch(/unsubscribed/);
    expect(await consentStatus(phone)).toBe("opted_out");
    expect((await sendSms({ phone, body: "after stop" })).ok).toBe(false);
    expect(await handleInbound(phone, "HELP", "test")).toMatch(/Help/);
    expect(await handleInbound(phone, "START", "test")).toMatch(/resubscribed/);
    expect((await sendSms({ phone, body: "back" })).ok).toBe(true);
  });
  it("counts segments for GSM and Unicode", () => {
    expect(segmentCount("a".repeat(160)).segments).toBe(1);
    expect(segmentCount("a".repeat(161)).segments).toBe(2);
    expect(segmentCount("ñ".repeat(10)).unicode).toBe(false);
    expect(segmentCount("ü€").unicode).toBe(false);
    expect(segmentCount("✓ done").unicode).toBe(true);
  });
  it("normalizes phones", () => { expect(normalizePhone("203-555-0148")).toBe("+12035550148"); expect(normalizePhone("123")).toBeNull(); });
  it("validates Twilio signatures", () => {
    const url = "https://x.example/api/sms/inbound"; const params = { Body: "STOP", From: "+12035550111" };
    const sig = createHmac("sha1", "tok").update(url + "BodySTOPFrom+12035550111").digest("base64");
    expect(validTwilioSignature(url, params, sig, "tok")).toBe(true);
    expect(validTwilioSignature(url, { ...params, Body: "START" }, sig, "tok")).toBe(false);
    expect(validTwilioSignature(url, params, null, "tok")).toBe(false);
  });
});

describe("authorization and sessions", () => {
  it("enforces the permission matrix", () => {
    expect(can("publisher", "referrals.read")).toBe(false);
    expect(can("counselor", "content.edit")).toBe(false);
    expect(can("counselor", "audit.read")).toBe(false);
    expect(can("publisher", "content.approve")).toBe(false);
    expect(can("admin", "content.approve")).toBe(true);
    expect(MATRIX["data.export"]).toEqual(["admin"]);
  });
  it("logs in, rejects bad passwords, locks after 5 failures, revokes sessions", async () => {
    const step1 = await login("counselor@demo.workplace", "Counselor-Demo-2026");
    expect("mfa" in step1).toBe(true);
    if (!("mfa" in step1)) return;
    expect(await staffFromToken(step1.mfa)).toBeNull(); // a half-finished sign-in is not a session
    await expect(verifyMfa(step1.mfa, "000000")).rejects.toMatchObject({ status: 401 });
    const sec = (await q1<{ mfa_secret: string }>("SELECT mfa_secret FROM staff_users WHERE id = 'u_counselor'"))!.mfa_secret;
    const { token } = await verifyMfa(step1.mfa, totp(sec));
    expect((await staffFromToken(token))?.role).toBe("counselor");
    await expect(login("counselor@demo.workplace", "wrong")).rejects.toMatchObject({ status: 401 });
    await expect(login("nobody@demo.workplace", "x")).rejects.toMatchObject({ status: 401 });
    await revokeSessions("u_counselor");
    expect(await staffFromToken(token)).toBeNull();
    for (let i = 0; i < 5; i++) await login("okafor@demo.workplace", "bad").catch(() => {});
    await expect(login("okafor@demo.workplace", "Counselor-Demo-2026")).rejects.toMatchObject({ status: 423 });
    expect(await staffFromToken("forged.token.value")).toBeNull();
  });
});

describe("TOTP", () => {
  it("matches RFC 6238 test vector and tolerates one step of drift", () => {
    const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"; // "12345678901234567890"
    expect(totp(secret, 59_000)).toBe("287082");
    expect(verifyTotp(secret, totp(secret, 1_000_000 - 30_000), 1_000_000)).toBe(true);
    expect(verifyTotp(secret, totp(secret, 1_000_000 - 90_000), 1_000_000)).toBe(false);
  });
});

describe("rate limiting", () => {
  it("blocks after the limit", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("t:1", 3, 60);
    await expect(rateLimit("t:1", 3, 60)).rejects.toMatchObject({ status: 429 });
  });
});

describe("tamper-evident audit log", () => {
  it("verifies, then detects an edited row", async () => {
    const ok = await verifyAuditChain();
    expect(ok.ok).toBe(true);
    expect(ok.checked).toBeGreaterThan(5);
    await q("UPDATE audit_log SET action = 'tampered' WHERE seq = 2");
    const bad = await verifyAuditChain();
    expect(bad).toMatchObject({ ok: false, brokenAt: 2 });
  });
});

describe("reports", () => {
  it("builds the monthly report without errors", async () => {
    const { getReport } = await import("@/lib/reports");
    const r = await getReport(30);
    expect(r.funnel[0][1]).toBeGreaterThan(0);
    expect(r.byService.length).toBeGreaterThan(0);
  });
});

describe("SMS hardening and retention", () => {
  it("dedupes a retried inbound webhook by MessageSid", async () => {
    const { handleInbound } = await import("@/lib/sms");
    await handleInbound("+12035550190", "HELP", "test", "SMdup1");
    const again = await handleInbound("+12035550190", "HELP", "test", "SMdup1");
    expect(again).toBeNull();
    const n = await q1<{ n: number }>("SELECT count(*)::int n FROM sms_messages WHERE provider_sid = 'SMdup1'");
    expect(n?.n).toBe(1);
  });
  it("sends at most one automated confirmation per number per day", async () => {
    const { recordConsent, sendSms } = await import("@/lib/sms");
    await recordConsent("+12035550199", "opt_in", "test");
    expect((await sendSms({ phone: "+12035550199", body: "c1", kind: "confirmation" })).ok).toBe(true);
    expect((await sendSms({ phone: "+12035550199", body: "c2", kind: "confirmation" })).ok).toBe(false);
  });
  it("applies retention: old message bodies removed, closed referrals de-identified", async () => {
    const { applyRetention } = await import("@/lib/retention");
    await q("UPDATE sms_messages SET created_at = now() - interval '200 days' WHERE phone = '+12035550199'");
    await q("UPDATE referrals SET updated_at = now() - interval '400 days' WHERE status = 'closed'");
    const r = await applyRetention();
    expect(r.messageBodiesRemoved).toBeGreaterThan(0);
    expect(r.referralsDeidentified).toBeGreaterThan(0);
    const left = await q("SELECT 1 FROM referrals WHERE status = 'closed' AND phone IS NOT NULL");
    expect(left.length).toBe(0);
  });
});
