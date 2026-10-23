import type { DataStore } from "../data";
import type { DoorManifest, DoorOp, DoorOpResult } from "../door";
import { cleanWalkIn } from "../door";
import { StoreError } from "../data/store";
import { secrets } from "./config";
import { verifyTicket } from "./crypto";

// F2 · sisi server pintu: manifest untuk HP panitia + penerapan antrean check-in.

export function toDoorManifest(store: DataStore, eventId: string): DoorManifest {
  const tickets = new Map(store.listTickets(eventId).map((t) => [t.guestId, t]));
  return {
    eventId,
    rev: store.rev,
    guests: store.listGuests(eventId).map((g) => {
      const t = tickets.get(g.id);
      return {
        id: g.id,
        name: g.name,
        ig: g.ig,
        keyNo: g.keyNo,
        rsvp: g.rsvp,
        source: g.source,
        ticketId: t?.ticketId ?? null,
        shortCode: t?.shortCode ?? null,
        status: t?.status ?? "aktif",
        checkedInAt: t?.checkedInAt ?? null,
        guestNo: t?.guestNo ?? null,
        method: t?.method ?? null,
        opId: t?.opId ?? null,
      };
    }),
  };
}

const MAX_SKEW_MS = 12 * 60 * 60 * 1000;

// Jam scan dari HP (antrean offline) dipakai kalau masuk akal; kalau jam HP ngaco → jam server.
function opTime(at: string, now: Date): string {
  const t = new Date(at).getTime();
  return Number.isFinite(t) && Math.abs(t - now.getTime()) < MAX_SKEW_MS
    ? new Date(t).toISOString()
    : now.toISOString();
}

export function applyDoorOp(
  store: DataStore,
  eventId: string,
  by: string,
  op: DoorOp,
  now: Date,
): DoorOpResult {
  const base = { opId: op.opId, by, at: opTime(op.at, now) };
  try {
    switch (op.kind) {
      case "scan": {
        const ticketId = verifyTicket(secrets().ticketSecret, String(op.payload));
        if (!ticketId) return { kind: "tidak-dikenal" };
        return store.checkIn(eventId, { ticketId }, { ...base, method: "scan" });
      }
      case "manual":
        return store.checkIn(eventId, { guestId: op.guestId }, { ...base, method: "manual" });
      case "walkin": {
        const r = cleanWalkIn({ name: String(op.name), ig: String(op.ig ?? "") });
        if (!r.ok) return { kind: "gagal", error: r.error };
        return store.addWalkIn(eventId, { name: r.name, ig: r.ig }, { ...base, method: "manual" });
      }
      case "undo":
        store.undoCheckIn(op.target);
        return { kind: "dibatalkan" };
      default:
        return { kind: "gagal", error: "Aksi nggak dikenal" };
    }
  } catch (err) {
    if (err instanceof StoreError) return { kind: "gagal", error: err.message };
    throw err;
  }
}
