import { EVENT } from "./event";

// File kalender (.ics) untuk "Simpan ke kalender" di T03. Tanpa data pribadi selain link tiket.
function utcStamp(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildIcs(opts: { uid: string; ticketUrl: string; now?: Date }): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Potara Studio//House Moving Day//ID",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@hmd.potara`,
    `DTSTAMP:${utcStamp((opts.now ?? new Date()).toISOString())}`,
    `DTSTART:${utcStamp(EVENT.startsAt)}`,
    `DTEND:${utcStamp(EVENT.endsAt)}`,
    `SUMMARY:${escapeText(`${EVENT.name} · ${EVENT.host}`)}`,
    `LOCATION:${escapeText(EVENT.location)}`,
    `DESCRIPTION:${escapeText(`Tunjukkan tiketmu ke panitia di pintu: ${opts.ticketUrl}`)}`,
    `URL:${opts.ticketUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`${EVENT.name} mulai 13.00`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
