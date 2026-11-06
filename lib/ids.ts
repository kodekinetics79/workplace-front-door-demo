import { randomBytes, randomInt, createHash } from "crypto";
export const newId = () => randomBytes(12).toString("base64url");
export const refCode = (prefix: "WP" | "WB") => `${prefix}-${randomInt(100000, 1000000)}`;
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
/** Pseudonymous salted hash (visitors, IPs). Raw values are never stored. */
export const pseudo = (s: string) => sha256(`${process.env.SESSION_SECRET ?? "dev-only-secret"}|${s}`).slice(0, 24);
