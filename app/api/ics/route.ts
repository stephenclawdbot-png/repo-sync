import { getEvent } from "@/lib/events";
import { fail } from "@/lib/http";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ev = getEvent(url.searchParams.get("slug") ?? "");
  if (!ev) return fail("Unknown event.", 404);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stagepass//EN",
    "BEGIN:VEVENT",
    `UID:${ev.slug}@stagepass`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(ev.startsAt)}`,
    `DTEND:${stamp(ev.endsAt)}`,
    `SUMMARY:${esc(ev.title)}`,
    `LOCATION:${esc(`${ev.venue}, ${ev.city}`)}`,
    `DESCRIPTION:${esc(ev.tagline)}`,
    `URL:${url.origin}/e/${ev.slug}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${ev.slug}.ics"`,
    },
  });
}
