import { createHmac, randomBytes, timingSafeEqual } from "crypto";
// RFC 6238 TOTP (SHA-1, 6 digits, 30 s) — compatible with Microsoft/Google Authenticator, 1Password, Authy.
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret(bytes = 20) {
  const buf = randomBytes(bytes); let bits = 0, val = 0, out = "";
  for (const b of buf) { val = (val << 8) | b; bits += 8; while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}
function decode(s: string) {
  const clean = s.replace(/=+$/, "").toUpperCase(); let bits = 0, val = 0; const out: number[] = [];
  for (const c of clean) { const i = B32.indexOf(c); if (i < 0) continue; val = (val << 5) | i; bits += 5; if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}
export function totp(secret: string, at = Date.now(), step = 30) {
  const counter = Math.floor(at / 1000 / step); const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1_000_000).padStart(6, "0");
}
/** Accepts the current code and one step either side for clock drift. */
export function verifyTotp(secret: string, code: string, at = Date.now()) {
  if (!/^\d{6}$/.test(code)) return false;
  return [-1, 0, 1].some((d) => { const a = Buffer.from(totp(secret, at + d * 30_000)); const b = Buffer.from(code); return timingSafeEqual(a, b); });
}
export const otpauthUri = (secret: string, account: string) => `otpauth://totp/The%20WorkPlace:${encodeURIComponent(account)}?secret=${secret}&issuer=The%20WorkPlace&digits=6&period=30`;
