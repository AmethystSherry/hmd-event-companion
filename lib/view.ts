import type { EventCardData } from "@/components/f1/EventList";
import type { GuestRowData } from "@/components/f1/GuestManager";
import { formatWa } from "./csv";
import type { Event, Guest } from "./data/types";
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

export function toGuestRow(g: Guest, event: Event, origin: string): GuestRowData {
  return {
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
