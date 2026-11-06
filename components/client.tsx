"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./Icon";
import type { Dict } from "@/lib/i18n";

/* ---------- analytics (pseudonymous, no PII) ---------- */
export function ping(name: string, props: Record<string, string | number | boolean> = {}) {
  try {
    const lang = document.documentElement.lang;
    const body = JSON.stringify({ name, lang, props });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch { /* analytics must never break the app */ }
}
export function SessionPing() {
  useEffect(() => { try { if (!sessionStorage.getItem("wp_s")) { sessionStorage.setItem("wp_s", "1"); ping("session_start"); } } catch {} }, []);
  return null;
}
export function Ping({ name, props }: { name: string; props?: Record<string, string | number | boolean> }) {
  const done = useRef(false);
  useEffect(() => { if (!done.current) { done.current = true; ping(name, props); } }, [name, props]);
  return null;
}

/* ---------- language ---------- */
export function LangToggle({ lang, label }: { lang: "en" | "es"; label: string }) {
  const router = useRouter();
  const set = (l: "en" | "es") => {
    if (l === lang) return;
    document.cookie = `lang=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = l;
    ping("language_switch", { to: l });
    router.refresh();
  };
  return (
    <div className="lang glass glass-d" role="group" aria-label={label} data-lang={lang}>
      <span className="thumb" aria-hidden="true" />
      <button type="button" aria-pressed={lang === "en"} onClick={() => set("en")}>EN</button>
      <button type="button" aria-pressed={lang === "es"} onClick={() => set("es")} lang="es" aria-label="Español">ES</button>
    </div>
  );
}

/* ---------- display settings ---------- */
export function DisplaySettings({ t }: { t: Dict }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState("md");
  const [contrast, setContrast] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { setSize(document.documentElement.dataset.text || "md"); setContrast(document.documentElement.dataset.contrast === "high"); }, []);
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const applySize = (s: string) => { setSize(s); const d = document.documentElement; if (s === "md") { delete d.dataset.text; localStorage.removeItem("wp_text"); } else { d.dataset.text = s; localStorage.setItem("wp_text", s); } };
  const applyContrast = (on: boolean) => { setContrast(on); const d = document.documentElement; if (on) { d.dataset.contrast = "high"; localStorage.setItem("wp_contrast", "high"); } else { delete d.dataset.contrast; localStorage.removeItem("wp_contrast"); } };
  return (
    <>
      <button type="button" className="icon-btn" aria-label={t.a11y_h} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><Icon name="settings" /></button>
      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="ds-h">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id="ds-h" className="h2">{t.a11y_h}</h2>
              <button ref={closeRef} type="button" className="icon-btn" style={{ color: "var(--ink)" }} aria-label="Close" onClick={() => setOpen(false)}><Icon name="x" /></button>
            </div>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <legend className="legend" style={{ marginBottom: 8 }}>{t.text_size}</legend>
              <div className="seg">
                {[["md", "A"], ["lg", "A+"], ["xl", "A++"]].map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={size === k} onClick={() => applySize(k)} style={{ fontSize: k === "md" ? 15 : k === "lg" ? 17 : 19 }}>{l}</button>
                ))}
              </div>
            </fieldset>
            <fieldset style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              <legend className="legend" style={{ marginBottom: 8 }}>{t.contrast}</legend>
              <div className="seg" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <button type="button" aria-pressed={!contrast} onClick={() => applyContrast(false)}>{t.off}</button>
                <button type="button" aria-pressed={contrast} onClick={() => applyContrast(true)}>{t.on}</button>
              </div>
            </fieldset>
          </div>
        </>
      )}
    </>
  );
}

/* ---------- tab bar ---------- */
export function TabBar({ t }: { t: Dict }) {
  const path = usePathname();
  const tabs = [
    { href: "/", label: t.nav_discover, icon: "compass", match: (p: string) => !["/saved", "/track", "/help"].some((x) => p.startsWith(x)) },
    { href: "/saved", label: t.nav_saved, icon: "bookmark", match: (p: string) => p.startsWith("/saved") },
    { href: "/track", label: t.nav_track, icon: "route", match: (p: string) => p.startsWith("/track") },
    { href: "/help", label: t.nav_help, icon: "help", match: (p: string) => p.startsWith("/help") },
  ];
  return (
    <nav className="tabbar glass glass-l" aria-label={t.nav}>
      {tabs.map((tb) => {
        const on = tb.match(path);
        return (
          <Link key={tb.href} href={tb.href} aria-current={on ? "page" : undefined}>
            <span className="pill"><Icon name={tb.icon} fill={on && tb.icon === "bookmark" ? "currentColor" : "none"} /></span>
            <span>{tb.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------- saved services (device only) ---------- */
const KEY = "wp_saved";
const listeners = new Set<() => void>();
const readSaved = (): string[] => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };
let cache: string[] | null = null;
const getSnapshot = () => { const v = JSON.stringify(readSaved()); if (!cache || JSON.stringify(cache) !== v) cache = JSON.parse(v); return cache!; };
const subscribe = (cb: () => void) => { listeners.add(cb); const on = (e: StorageEvent) => { if (e.key === KEY) cb(); }; window.addEventListener("storage", on); return () => { listeners.delete(cb); window.removeEventListener("storage", on); }; };
const EMPTY: string[] = [];
export function useSaved() { return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY); }
export function toggleSaved(id: string) {
  const cur = readSaved(); const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(next)); if (!cur.includes(id)) ping("save_service", { id }); listeners.forEach((l) => l());
}

export function SaveButton({ id, title, t, variant = "icon" }: { id: string; title: string; t: Dict; variant?: "icon" | "full" }) {
  const saved = useSaved().includes(id);
  const label = (saved ? t.unsave_a : t.save_a).replace("{t}", title);
  if (variant === "full") return (
    <button type="button" className="btn btn-secondary btn-sm" aria-pressed={saved} onClick={() => toggleSaved(id)}>
      <Icon name="bookmark" size={18} fill={saved ? "currentColor" : "none"} />{saved ? t.saved : t.save}
    </button>
  );
  return (
    <button type="button" className="btn btn-sm" aria-pressed={saved} aria-label={label} onClick={() => toggleSaved(id)}
      style={{ width: 48, padding: 0, border: `1.5px solid ${saved ? "var(--blue)" : "var(--field)"}`, background: saved ? "var(--blue-tint)" : "#fff", color: saved ? "var(--blue)" : "var(--ink-2)" }}>
      <Icon name="bookmark" size={20} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}

/* ---------- read aloud (Web Speech API, no data leaves the device) ---------- */
export function ListenButton({ text, lang, t }: { text: string; lang: "en" | "es"; t: Dict }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => { setSupported(typeof window !== "undefined" && "speechSynthesis" in window); return () => { try { window.speechSynthesis.cancel(); } catch {} }; }, []);
  if (!supported) return null;
  const toggle = () => {
    const s = window.speechSynthesis;
    if (speaking) { s.cancel(); setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text); u.lang = lang === "es" ? "es-US" : "en-US"; u.rate = 0.95;
    u.onend = () => setSpeaking(false); u.onerror = () => setSpeaking(false);
    s.cancel(); s.speak(u); setSpeaking(true); ping("listen");
  };
  return (
    <button type="button" className="btn btn-sm" onClick={toggle} aria-pressed={speaking}
      style={{ background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)", alignSelf: "flex-start" }}>
      <Icon name={speaking ? "stop" : "speaker"} size={18} />{speaking ? t.stop_listen : t.listen}
    </button>
  );
}
