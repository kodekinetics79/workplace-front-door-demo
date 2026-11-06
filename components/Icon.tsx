const P: Record<string, string> = {
  back: "M15 18l-6-6 6-6", chevron: "M9 6l6 6-6 6", search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3",
  check: "M5 12l5 5L20 7", info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01", alert: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v5M12 16h.01",
  x: "M6 6l12 12M18 6L6 18", phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2",
  chat: "M4 5h16v11H8l-4 4z", pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  compass: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z", bookmark: "M6 4h12v17l-6-4-6 4z",
  help: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01", route: "M6 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM18 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM6 8v4a4 4 0 0 0 4 4h6",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z", access: "M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 9l7 1 7-1M12 10v5M9 21l3-6 3 6",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", job: "M4 8h16v11H4zM9 8V5h6v3", skills: "M4 6l8-3 8 3-8 3zM8 8v5c0 1.5 2 3 4 3s4-1.5 4-3V8",
  youth: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z", employer: "M4 20V8l8-4 8 4v12M9 20v-6h6v6",
  settings: "M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4", speaker: "M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6", stop: "M7 7h10v10H7z",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14", logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11", inbox: "M4 13l2-8h12l2 8v6H4zM4 13h5l1 2h4l1-2h5",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4", chart: "M4 20V10M10 20V4M16 20v-8M22 20H2", list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  lock: "M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3", qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7", send: "M4 12l16-8-6 16-2-7z",
};
export function Icon({ name, size = 22, stroke = 2, fill = "none", className, label }: { name: keyof typeof P | string; size?: number; stroke?: number; fill?: string; className?: string; label?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden={label ? undefined : true} role={label ? "img" : undefined} aria-label={label}>
      <path d={P[name] ?? P.info} />
    </svg>
  );
}
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true"><rect width="26" height="26" rx="7" fill="#F2B233" /><path d="M6 17.5h14M9 17.5V12M13 17.5V8.5M17 17.5V11" stroke="#12304A" strokeWidth="2.4" strokeLinecap="round" /></svg>
  );
}
