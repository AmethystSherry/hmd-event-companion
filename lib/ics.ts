import { eventStart } from "./format";
import type { Event } from "./data/types";

// File kalender (.ics) untuk "Simpan ke kalender" di T03: tanggal, jam, lokasi + link tiket.
function utcStamp(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(opts: {
  event: Event;
  uid: string;
  ticketUrl: string;
  now?: Date;
}): string {
  const { event } = opts;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Potara Studio//House Moving Day//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@hmd.potara`,
    `DTSTAMP:${utcStamp(opts.now ?? new Date())}`,
    `DTSTART:${utcStamp(eventStart(event.date, event.startsAt))}`,
    `DTEND:${utcStamp(eventStart(event.date, event.endsAt))}`,
    `SUMMARY:${escapeText(`${event.name} · Potara Studio`)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DESCRIPTION:${escapeText(`Tunjukkan tiketmu ke panitia di pintu: ${opts.ticketUrl}`)}`,
    `URL:${opts.ticketUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`${event.name} mulai ${event.startsAt}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
