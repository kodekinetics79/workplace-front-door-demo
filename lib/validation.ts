import { z } from "zod";
import { normalizePhone } from "./sms";

const clean = (max: number) => z.string().trim().max(max).transform((s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""));
const optional = (max: number) => clean(max).optional().transform((s) => (s ? s : undefined));

export const ResidentRequest = z.object({
  kind: z.literal("resident"),
  serviceId: z.string().max(40).regex(/^[a-z0-9-]+$/).optional(),
  firstName: clean(60).pipe(z.string().min(1, "e_name")),
  method: z.enum(["callback", "email", "text"]),
  phone: optional(30),
  email: optional(120),
  bestTime: z.enum(["any", "am", "pm"]).default("any"),
  area: z.enum(["bridgeport", "stamford", "valley", "online", ""]).optional(),
  note: optional(600),
  smsConsent: z.boolean().default(false),
  lang: z.enum(["en", "es"]).default("en"),
  website: z.string().max(0).optional(), // honeypot: real people never fill this
}).superRefine((v, ctx) => {
  if (v.method !== "email" && !normalizePhone(v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "e_phone" });
  if (v.method === "email" && !z.email().safeParse(v.email ?? "").success) ctx.addIssue({ code: "custom", path: ["email"], message: "e_email" });
  if (v.email && !z.email().safeParse(v.email).success) ctx.addIssue({ code: "custom", path: ["email"], message: "e_email" });
});

export const EmployerRequest = z.object({
  kind: z.literal("employer"),
  company: clean(120).pipe(z.string().min(1, "e_req")),
  firstName: clean(80).pipe(z.string().min(1, "e_req")),
  email: clean(120).pipe(z.email("e_email")),
  phone: optional(30),
  need: z.enum(["recruit", "train", "event"]),
  openings: z.coerce.number().int().min(0).max(10000).optional(),
  note: optional(600),
  lang: z.enum(["en", "es"]).default("en"),
  website: z.string().max(0).optional(),
}).superRefine((v, ctx) => { if (v.phone && !normalizePhone(v.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "e_phone" }); });


export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) { const k = String(i.path[0] ?? "form"); if (!out[k]) out[k] = i.message.startsWith("e_") ? i.message : k === "firstName" ? "e_name" : "e_req"; }
  return out;
}

export const StaffReferralPatch = z.object({
  status: z.enum(["new", "review", "contacted", "closed"]).optional(),
  assignedTo: z.string().max(40).nullable().optional(),
}).refine((v) => v.status !== undefined || v.assignedTo !== undefined, "empty");

export const ServiceTextSchema = z.object({ type: clean(40), title: clean(120), sum: clean(400), who: clean(300), how: clean(300), bring: clean(300) });
export const ServiceDraftSchema = z.object({ en: ServiceTextSchema, es: ServiceTextSchema });
