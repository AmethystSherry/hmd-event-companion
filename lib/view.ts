import type { EventCardData } from "@/components/f1/EventList";
import type { GuestRowData } from "@/components/f1/GuestManager";
import { formatWa } from "./csv";
import type { Event, Guest } from "./data/types";
import type { BadgeTone } from "@/components/ui/Badge";
import { dateLong, dayMonth, eventPhase } from "./format";
import { DEFAULT_DM_TEMPLATE, guestLink } from "./invite";

// Ubah data store jadi props layar F1 (dipakai route panitia & /dev/states/f1).

export function toEventCard(
  e: Event,
  counts: { guests: number; sessions: number },
  now: Date,
): EventCardData {
  return {
    id: e.id,
    name: e.name,
    dateLabel: dateLong(e.date),
    phase: eventPhase(e.date, now),
    ...counts,
  };
}

// Status baris tamu P04* — satu badge per baris, dipakai juga buat hitungan filter.
export type GuestStatusKey = "hadir" | "nggak" | "barusan" | "belumJawab" | "belum";
export const JUST_INVITED_MS = 10 * 60 * 1000;
const STATUS: Record<GuestStatusKey, { tone: BadgeTone; label: string }> = {
  hadir: { tone: "success", label: "Hadir" },
  nggak: { tone: "danger", label: "Nggak bisa" },
  barusan: { tone: "success", label: "Diundang barusan" },
  belumJawab: { tone: "crew", label: "Belum jawab" },
  belum: { tone: "neutral", label: "Belum diundang" },
};

export function guestStatus(
  g: Pick<Guest, "inviteStatus" | "invitedAt" | "rsvp">,
  now: Date,
): { key: GuestStatusKey; tone: BadgeTone; label: string } {
  const key: GuestStatusKey =
    g.rsvp === "hadir"
      ? "hadir"
      : g.rsvp === "nggak"
        ? "nggak"
        : g.inviteStatus === "belum"
          ? "belum"
          : g.invitedAt && now.getTime() - new Date(g.invitedAt).getTime() < JUST_INVITED_MS
            ? "barusan"
            : "belumJawab";
  return { key, ...STATUS[key] };
}

export const statusBadge = (key: GuestStatusKey) => STATUS[key];

export function toGuestRow(g: Guest, event: Event, origin: string, now: Date): GuestRowData {
  return {
    status: guestStatus(g, now).key,
    id: g.id,
    name: g.name,
    ig: g.ig,
    wa: g.wa,
    waDisplay: g.wa ? formatWa(g.wa) : "",
    inviteStatus: g.inviteStatus,
    invitedLabel: g.invitedAt ? dayMonth(g.invitedAt) : null,
    rsvp: g.rsvp,
    reminderSent: !!g.reminderSentAt,
    source: g.source,
    dmTemplate: g.dmTemplate ?? event.dmTemplate,
    link: guestLink(origin, g.token),
    reminderLink: guestLink(origin, g.token, true),
  };
}

export function templateFromCsv(event: Event): boolean {
  return !!event.csvImportedAt && event.dmTemplate !== DEFAULT_DM_TEMPLATE;
}
