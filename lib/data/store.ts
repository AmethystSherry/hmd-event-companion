import { randomBytes, randomUUID } from "node:crypto";
import type { CsvRow } from "../csv";
import { toMinutes } from "../format";
import type {
  Event,
  Guest,
  GuestStats,
  Rsvp,
  Session,
  SessionType,
  StoreData,
  Ticket,
} from "./types";

// Store F1: semua data di satu objek, tiap perubahan menaikkan `rev`, memanggil `persist`
// (file JSON lokal) dan memberi tahu pelanggan SSE. Logika murni — tanpa Next — supaya bisa dites.

export class StoreError extends Error {
  constructor(
    public code:
      "event-tidak-ada" | "tamu-tidak-ada" | "sesi-tidak-ada" | "csv-sudah-diunggah" | "ig-dipakai",
    message: string,
  ) {
    super(message);
  }
}

export type SessionInput = {
  title: string;
  startsAt: string;
  durationMin: number;
  type: SessionType;
  pic: string;
};

export type GuestInput = { name: string; ig: string; wa: string | null };

export type RsvpInput = {
  rsvp: Exclude<Rsvp, "belum">;
  name: string;
  ig: string;
  wa: string | null;
  followConfirmed: boolean;
};

export type InviteSnapshot = Pick<Guest, "inviteStatus" | "invitedAt">;

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // tanpa 0/O/1/I

// Token link tamu: 22 karakter base64url (128 bit acak) — tidak bisa ditebak (prd.md §7 F1).
export const newToken = () => randomBytes(16).toString("base64url");

function shortCode(keyNo: number): string {
  const tail = Array.from(randomBytes(4), (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `HMD-${String(keyNo).padStart(3, "0")}-${tail}`;
}

export function emptyData(): StoreData {
  return { version: 1, rev: 0, events: [], guests: [], sessions: [], tickets: [] };
}

export function computeStats(guests: Guest[]): GuestStats {
  const invited = guests.filter((g) => g.inviteStatus === "diundang").length;
  const hadir = guests.filter((g) => g.rsvp === "hadir").length;
  const nggak = guests.filter((g) => g.rsvp === "nggak").length;
  return {
    total: guests.length,
    invited,
    notInvited: guests.length - invited,
    hadir,
    nggak,
    belumJawab: guests.filter((g) => g.inviteStatus === "diundang" && g.rsvp === "belum").length,
    answered: hadir + nggak,
  };
}

export function createStore(
  initial: StoreData,
  opts: { persist?: (data: StoreData) => void; now?: () => Date } = {},
) {
  const data = initial;
  const now = () => (opts.now ? opts.now() : new Date()).toISOString();
  const listeners = new Set<(rev: number) => void>();

  function commit() {
    data.rev += 1;
    opts.persist?.(data);
    for (const l of listeners) l(data.rev);
  }

  function event(id: string): Event {
    const e = data.events.find((x) => x.id === id);
    if (!e) throw new StoreError("event-tidak-ada", "Event nggak ketemu");
    return e;
  }

  function guest(id: string): Guest {
    const g = data.guests.find((x) => x.id === id);
    if (!g) throw new StoreError("tamu-tidak-ada", "Tamu nggak ketemu");
    return g;
  }

  function guestsOf(eventId: string): Guest[] {
    return data.guests.filter((g) => g.eventId === eventId);
  }

  function assertIgFree(eventId: string, ig: string, exceptId?: string) {
    if (guestsOf(eventId).some((g) => g.ig === ig && g.id !== exceptId)) {
      throw new StoreError("ig-dipakai", "Username IG ini udah dipakai tamu lain");
    }
  }

  function nextKeyNo(eventId: string): number {
    return guestsOf(eventId).reduce((max, g) => Math.max(max, g.keyNo), 0) + 1;
  }

  function newGuest(
    eventId: string,
    input: GuestInput & { dmTemplate?: string | null },
    source: Guest["source"],
  ): Guest {
    return {
      id: randomUUID(),
      eventId,
      token: newToken(),
      name: input.name,
      ig: input.ig,
      wa: input.wa,
      dmTemplate: input.dmTemplate ?? null,
      inviteStatus: "belum",
      invitedAt: null,
      rsvp: "belum",
      respondedAt: null,
      followConfirmed: false,
      keyNo: nextKeyNo(eventId),
      reminderSentAt: null,
      source,
      createdAt: now(),
    };
  }

  return {
    get rev() {
      return data.rev;
    },
    subscribe(listener: (rev: number) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    // ---- Event (PE01–PE03) ----
    listEvents(): Event[] {
      return [...data.events].sort((a, b) => a.date.localeCompare(b.date));
    },
    getEvent(id: string): Event | null {
      return data.events.find((e) => e.id === id) ?? null;
    },
    createEvent(
      input: { name: string; date: string },
      defaults: Pick<Event, "dmTemplate" | "location">,
    ): Event {
      const e: Event = {
        id: randomUUID().slice(0, 8),
        name: input.name,
        date: input.date,
        startsAt: "13.00",
        endsAt: "17.00",
        location: defaults.location,
        csvImportedAt: null,
        csvFileName: null,
        dmTemplate: defaults.dmTemplate,
        createdAt: now(),
      };
      data.events.push(e);
      commit();
      return e;
    },
    // PE03e · ubah nama & tanggal. Tamu & rundown tidak berubah.
    updateEvent(id: string, input: { name: string; date: string }): Event {
      const e = event(id);
      e.name = input.name;
      e.date = input.date;
      commit();
      return e;
    },
    // PE03h · hapus event berantai: tamu (+ tiket), status undangan, dan rundown ikut terhapus.
    deleteEvent(id: string): void {
      event(id);
      const guestIds = new Set(guestsOf(id).map((g) => g.id));
      data.events = data.events.filter((e) => e.id !== id);
      data.guests = data.guests.filter((g) => g.eventId !== id);
      data.tickets = data.tickets.filter((t) => !guestIds.has(t.guestId));
      data.sessions = data.sessions.filter((s) => s.eventId !== id);
      commit();
    },

    // ---- Rundown (PE04k/PE04/PE04a) — urutan selalu ikut jam mulai ----
    listSessions(eventId: string): Session[] {
      return data.sessions
        .filter((s) => s.eventId === eventId)
        .sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
    },
    addSession(eventId: string, input: SessionInput): Session {
      event(eventId);
      const s: Session = { id: randomUUID().slice(0, 8), eventId, tagline: null, ...input };
      data.sessions.push(s);
      commit();
      return s;
    },
    updateSession(id: string, input: SessionInput): Session {
      const s = data.sessions.find((x) => x.id === id);
      if (!s) throw new StoreError("sesi-tidak-ada", "Sesi nggak ketemu");
      Object.assign(s, input);
      commit();
      return s;
    },
    deleteSession(id: string): void {
      const before = data.sessions.length;
      data.sessions = data.sessions.filter((s) => s.id !== id);
      if (data.sessions.length === before)
        throw new StoreError("sesi-tidak-ada", "Sesi nggak ketemu");
      commit();
    },

    // ---- Tamu & undangan (P04*) ----
    listGuests(eventId: string): Guest[] {
      return guestsOf(eventId).sort((a, b) => a.keyNo - b.keyNo);
    },
    getGuest(id: string): Guest | null {
      return data.guests.find((g) => g.id === id) ?? null;
    },
    getGuestByToken(token: string): Guest | null {
      return data.guests.find((g) => g.token === token) ?? null;
    },
    stats(eventId: string): GuestStats {
      return computeStats(guestsOf(eventId));
    },

    // P04a: CSV hanya sekali per event. Baris error sudah dibuang pemanggil (P04c).
    importCsv(eventId: string, fileName: string, rows: CsvRow[], template: string | null): number {
      const e = event(eventId);
      if (e.csvImportedAt) {
        throw new StoreError("csv-sudah-diunggah", "CSV udah pernah diunggah buat event ini");
      }
      for (const r of rows) {
        if (guestsOf(eventId).some((g) => g.ig === r.ig)) continue;
        const g = newGuest(
          eventId,
          {
            name: r.name,
            ig: r.ig,
            wa: r.wa,
            dmTemplate: r.message && r.message !== template ? r.message : null,
          },
          "csv",
        );
        data.guests.push(g);
      }
      e.csvImportedAt = now();
      e.csvFileName = fileName;
      if (template) e.dmTemplate = template;
      commit();
      return rows.length;
    },

    // P04f: tamu baru selalu "Belum diundang".
    addGuest(eventId: string, input: GuestInput): Guest {
      event(eventId);
      assertIgFree(eventId, input.ig);
      const g = newGuest(eventId, input, "manual");
      data.guests.push(g);
      commit();
      return g;
    },

    // P04e: status undangan & jawaban tidak pernah di-reset saat data diubah.
    updateGuest(id: string, input: GuestInput): Guest {
      const g = guest(id);
      assertIgFree(g.eventId, input.ig, id);
      g.name = input.name;
      g.ig = input.ig;
      g.wa = input.wa;
      commit();
      return g;
    },
    deleteGuest(id: string): void {
      guest(id);
      data.guests = data.guests.filter((g) => g.id !== id);
      data.tickets = data.tickets.filter((t) => t.guestId !== id);
      commit();
    },

    // P04d: ditandai saat panitia balik dari IG (bukan bukti DM terkirim) — bisa dibatalkan.
    markInvited(id: string): InviteSnapshot {
      const g = guest(id);
      const prev = { inviteStatus: g.inviteStatus, invitedAt: g.invitedAt };
      g.inviteStatus = "diundang";
      g.invitedAt = now();
      commit();
      return prev;
    },
    restoreInvite(id: string, prev: InviteSnapshot): void {
      const g = guest(id);
      g.inviteStatus = prev.inviteStatus;
      g.invitedAt = prev.invitedAt;
      commit();
    },

    // P04b: pengingat H-1 dikirim manual lewat wa.me.
    markReminderSent(id: string): void {
      guest(id).reminderSentAt = now();
      commit();
    },

    // T02: jawaban tamu. Hadir → tiket aktif (dibuat sekali, dipakai lagi kalau ubah jawaban).
    setRsvp(id: string, input: RsvpInput): Guest {
      const g = guest(id);
      if (input.ig !== g.ig) assertIgFree(g.eventId, input.ig, id);
      g.rsvp = input.rsvp;
      g.respondedAt = now();
      g.name = input.name;
      g.ig = input.ig;
      g.wa = input.wa;
      g.followConfirmed = input.followConfirmed;
      // Link baru bisa sampai ke tamu yang belum ditandai (mis. diteruskan panitia langsung).
      if (g.inviteStatus === "belum") {
        g.inviteStatus = "diundang";
        g.invitedAt = g.respondedAt;
      }
      if (input.rsvp === "hadir" && !data.tickets.some((t) => t.guestId === id)) {
        data.tickets.push({
          ticketId: randomUUID(),
          guestId: id,
          shortCode: shortCode(g.keyNo),
          status: "aktif",
        });
      }
      commit();
      return g;
    },
    ticketFor(guestId: string): Ticket | null {
      return data.tickets.find((t) => t.guestId === guestId) ?? null;
    },

    snapshot(): StoreData {
      return data;
    },
    // Dev: ganti semua isi (mis. kembali ke seed). Pelanggan SSE ikut di-refresh.
    reset(next: StoreData): void {
      const rev = data.rev;
      Object.assign(data, next, { rev });
      commit();
    },
  };
}

export type DataStore = ReturnType<typeof createStore>;
