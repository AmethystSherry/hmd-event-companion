import type { Event } from "./types";

// Event udah dimulai: "Mulai event" di PE03 ditekan, atau state acara udah lewat "pre" (data lama).
// File kecil terpisah supaya layar klien (PE03) nggak ikut membundel store.
export function eventStarted(e: Pick<Event, "startedAt" | "mode">): boolean {
  return !!e.startedAt || (!!e.mode && e.mode !== "pre");
}
