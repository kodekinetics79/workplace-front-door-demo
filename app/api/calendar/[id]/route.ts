import { EVENTS } from "@/lib/content";
export const runtime = "nodejs";
const esc = (s: string) => s.replace(/[,;\\]/g, (m) => `\\${m}`);
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const lang = new URL(req.url).searchParams.get("lang") === "es" ? "es" : "en";
  const e = EVENTS.find((x) => x.id === id);
  if (!e) return new Response("Not found", { status: 404 });
  const d = (time: string) => `${e.date.replace(/-/g, "")}T${time.replace(":", "")}00`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The WorkPlace demo//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${e.id}@workplace-demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART;TZID=America/New_York:${d(e.start)}`, `DTEND;TZID=America/New_York:${d(e.end)}`,
    `SUMMARY:${esc(e.title[lang])}`, `LOCATION:${esc(e.place[lang])}`, "DESCRIPTION:Sample event (demonstration).", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return new Response(ics, { headers: { "content-type": "text/calendar; charset=utf-8", "content-disposition": `attachment; filename="${e.id}.ics"` } });
}
