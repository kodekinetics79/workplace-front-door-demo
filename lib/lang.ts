import { cookies, headers } from "next/headers";
import type { Lang } from "./content";
import { DICTS } from "./i18n";

export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get("lang")?.value;
  if (c === "es" || c === "en") return c;
  const al = (await headers()).get("accept-language") ?? "";
  return /^es\b/i.test(al.trim()) ? "es" : "en";
}
export async function getDict() { const lang = await getLang(); return { lang, t: DICTS[lang] }; }
