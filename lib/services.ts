import { q, q1 } from "./db";
import type { Lang, ServiceDoc, ServiceText } from "./content";
import { FORMAT_LABEL, TOWN_LABEL } from "./content";

export type ServiceRow = { id: string; goals: string[]; formats: string[]; towns: string[]; state: "draft" | "review" | "published"; live: ServiceDoc | null; draft: ServiceDoc; submitted_by: string | null; version: number; updated_by: string | null; updated_at: string };
export type PublicService = ServiceText & { id: string; goals: string[]; formats: string[]; towns: string[]; formatLabels: string[]; townLabels: string[] };

export function toPublic(r: ServiceRow, lang: Lang): PublicService | null {
  if (!r.live) return null;
  const t = r.live[lang]?.title ? r.live[lang] : r.live.en;
  return { ...t, id: r.id, goals: r.goals, formats: r.formats, towns: r.towns, formatLabels: r.formats.map((f) => FORMAT_LABEL[lang][f]), townLabels: r.towns.map((x) => TOWN_LABEL[lang][x]) };
}

/** Only the approved, published version is ever served to the public. */
export async function publishedServices(lang: Lang) {
  const rows = await q<ServiceRow>("SELECT * FROM services WHERE live IS NOT NULL ORDER BY id");
  return rows.map((r) => toPublic(r, lang)).filter(Boolean) as PublicService[];
}

export async function publishedService(id: string, lang: Lang) {
  const r = await q1<ServiceRow>("SELECT * FROM services WHERE id = $1 AND live IS NOT NULL", [id]);
  return r ? toPublic(r, lang) : null;
}

export function searchServices(list: PublicService[], opts: { goal?: string; q?: string; town?: string; format?: string }) {
  const needle = (opts.q ?? "").trim().toLowerCase();
  return list.filter((s) => {
    const hay = `${s.title} ${s.sum} ${s.type} ${s.who}`.toLowerCase();
    const okQ = needle ? needle.split(/\s+/).every((w) => hay.includes(w)) : opts.goal ? s.goals.includes(opts.goal) : true;
    return okQ && (!opts.town || opts.town === "all" || s.towns.includes(opts.town)) && (!opts.format || opts.format === "all" || s.formats.includes(opts.format));
  });
}

/** Flesch-Kincaid grade estimate for the plain-language check in the content console (English). */
export function readingGrade(text: string): number | null {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 5) return null;
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const syll = words.reduce((a, w) => a + Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, "").replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length), 0);
  return Math.max(1, Math.round(0.39 * (words.length / sentences) + 11.8 * (syll / words.length) - 15.59));
}
