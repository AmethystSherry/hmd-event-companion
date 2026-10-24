import { randomBytes, randomUUID } from "node:crypto";
import type { CsvRow } from "../csv";
import { MAX_IMPROVE, summaryDue } from "../feedback";
import { toMinutes } from "../format";
import type {
  CheckInMethod,
  CheckInResult,
  DoorStats,
  Event,
  Feedback,
  FeedbackForSummary,
  FeedbackInput,
  FeedbackRecap,
  Guest,
  GuestStats,
  Photo,
  PhotoSummary,
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
      | "event-tidak-ada"
      | "tamu-tidak-ada"
      | "sesi-tidak-ada"
      | "csv-sudah-diunggah"
      | "ig-dipakai"
      | "foto-tidak-ada"
      | "foto-penuh"
      | "acara-ditutup"
      | "sesi-belum-selesai"
      | "acara-belum-ditutup"
      | "belum-masuk"
      | "sudah-isi"
      | "isian-tidak-valid"
      | "data-dihapus",
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

// N4: metadata foto setelah file tersimpan. id = clientId (UUID dari HP).
export type PhotoInput = {
  id: string;
  guestId: string;
  at: string;
  width: number;
  height: number;
  bytes: number;
};

export const MAX_PHOTOS_PER_GUEST = 20;

// Satu operasi check-in dari HP panitia: opId acak dibuat di HP (dipakai ulang saat kirim ulang).
export type CheckInOp = { opId: string; method: CheckInMethod; by: string; at: string };

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

function emptyRecap(): FeedbackRecap {
  return {
    respondents: 0,
    expected: 0,
    avgRating: null,
    inviteAgainPct: null,
    highlights: [],
    improvements: [],
    summary: null,
    purgedAt: null,
  };
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

  // Kontrol sesi cuma selagi acara belum ditutup (F5: "Layar acara nggak bisa dibuka lagi").
  function openEvent(id: string): Event {
    const e = event(id);
    if (e.mode === "closed") throw new StoreError("acara-ditutup", "Acaranya udah ditutup");
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

  function photosOf(eventId: string, withDeleted = false): Photo[] {
    return (data.photos ?? [])
      .filter((p) => p.eventId === eventId && (withDeleted || !p.deletedAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  // Sesi untuk foto baru: yang lagi jalan, atau yang terakhir selesai (foto pas Jeda ikut sesi itu).
  function currentSessionId(eventId: string): string | null {
    const sessions = data.sessions.filter((s) => s.eventId === eventId);
    const active = sessions.find((s) => s.status === "berlangsung");
    if (active) return active.id;
    const done = sessions
      .filter((s) => s.endedAt)
      .sort((a, b) => b.endedAt!.localeCompare(a.endedAt!));
    return done[0]?.id ?? null;
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

  function sessionsOf(eventId: string): Session[] {
    return data.sessions
      .filter((s) => s.eventId === eventId)
      .sort((a, b) => toMinutes(a.startsAt) - toMinutes(b.startsAt));
  }

  function sessionOf(eventId: string, id: string): Session {
    const s = data.sessions.find((x) => x.id === id && x.eventId === eventId);
    if (!s) throw new StoreError("sesi-tidak-ada", "Sesi nggak ketemu");
    return s;
  }

  function closable(eventId: string): boolean {
    const list = sessionsOf(eventId);
    return (
      list.length > 0 &&
      !list.some((s) => s.status === "berlangsung") &&
      list[list.length - 1].status === "selesai"
    );
  }

  function feedbackOf(eventId: string): Feedback[] {
    return (data.feedback ?? [])
      .filter((f) => f.eventId === eventId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  function checkedInIds(eventId: string): Set<string> {
    const ids = new Set(guestsOf(eventId).map((g) => g.id));
    return new Set(
      data.tickets
        .filter((t) => ids.has(t.guestId) && t.status === "dipakai")
        .map((t) => t.guestId),
    );
  }

  // Rekap P11 dari isian sekarang (sebelum dihapus H+30).
  function liveRecap(eventId: string): FeedbackRecap {
    const list = feedbackOf(eventId);
    const sessions = sessionsOf(eventId);
    const answered = list.filter((f) => f.inviteAgain !== null);
    const avg = list.length ? list.reduce((n, f) => n + f.rating, 0) / list.length : null;
    return {
      respondents: list.length,
      // Pembagi = tamu yang udah masuk; yang ngisi pasti udah masuk (kecuali check-in dibatalkan).
      expected: Math.max(checkedInIds(eventId).size, list.length),
      avgRating: avg === null ? null : Math.round(avg * 10) / 10,
      inviteAgainPct: answered.length
        ? Math.round((answered.filter((f) => f.inviteAgain).length / answered.length) * 100)
        : null,
      highlights: sessions
        .map((s, i) => ({
          i,
          sessionId: s.id,
          title: s.title,
          count: list.filter((f) => f.highlightSessionId === s.id).length,
        }))
        .sort((a, b) => b.count - a.count || a.i - b.i)
        .map(({ sessionId, title, count }) => ({ sessionId, title, count })),
      improvements: list.flatMap((f, i) =>
        f.improve ? [{ no: i + 1, text: f.improve, at: f.createdAt }] : [],
      ),
      summary: event(eventId).summary?.points ?? null,
      purgedAt: null,
    };
  }

  // Sesi sesudah `id` (urut jam) yang belum selesai; null kalau sudah yang terakhir.
  function nextAfter(eventId: string, id: string): string | null {
    const list = sessionsOf(eventId);
    const i = list.findIndex((s) => s.id === id);
    return list.slice(i + 1).find((s) => s.status !== "selesai")?.id ?? null;
  }

  function ensureTicket(g: Guest): Ticket {
    const existing = data.tickets.find((t) => t.guestId === g.id);
    if (existing) return existing;
    const t: Ticket = {
      ticketId: randomUUID(),
      guestId: g.id,
      shortCode: shortCode(g.keyNo),
      status: "aktif",
    };
    data.tickets.push(t);
    return t;
  }

  // Op yang sudah pernah diterapkan → kembalikan hasil yang sama (idempoten).
  function replay(opId: string): CheckInResult | null {
    const t = data.tickets.find((x) => x.opId === opId && x.status === "dipakai");
    return t
      ? { kind: "valid", guestId: t.guestId, guestNo: t.guestNo ?? 0, at: t.checkedInAt! }
      : null;
  }

  function checkInGuest(g: Guest, t: Ticket, op: CheckInOp): CheckInResult {
    if (t.status === "dipakai") {
      return {
        kind: "sudah-dipakai",
        guestId: g.id,
        at: t.checkedInAt ?? op.at,
        method: t.method ?? "scan",
      };
    }
    t.rsvpBefore = g.rsvp;
    if (g.rsvp !== "hadir") {
      g.rsvp = "hadir";
      g.respondedAt = op.at;
    }
    const ids = new Set(guestsOf(g.eventId).map((x) => x.id));
    const guestNo =
      data.tickets.filter((x) => ids.has(x.guestId) && x.status === "dipakai").length + 1;
    Object.assign(t, {
      status: "dipakai",
      checkedInAt: op.at,
      checkedInBy: op.by,
      method: op.method,
      guestNo,
      opId: op.opId,
    } satisfies Partial<Ticket>);
    commit();
    return { kind: "valid", guestId: g.id, guestNo, at: op.at };
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
      if (data.photos) data.photos = data.photos.filter((p) => p.eventId !== id);
      if (data.feedback) data.feedback = data.feedback.filter((f) => f.eventId !== id);
      commit();
    },

    // ---- Rundown (PE04k/PE04/PE04a) — urutan selalu ikut jam mulai ----
    listSessions(eventId: string): Session[] {
      return sessionsOf(eventId);
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

    // ---- Kontrol acara hari-H (BP00 / BP00a / BP00b, prd.md §6) ----
    // Mulai sesi N: mode=sesi, N berlangsung (startedAt). Sesi lain yang masih jalan ikut selesai.
    // Mulai sesi yang sudah jalan = tidak berubah (dobel tap / dua HP panitia) → false, rev tetap.
    startSession(eventId: string, sessionId: string, at: string): boolean {
      const e = openEvent(eventId);
      const s = sessionOf(eventId, sessionId);
      if (s.status === "berlangsung") return false;
      for (const x of data.sessions) {
        if (x.eventId === eventId && x.status === "berlangsung") {
          x.status = "selesai";
          x.endedAt = at;
        }
      }
      Object.assign(s, {
        status: "berlangsung",
        startedAt: at,
        endedAt: null,
      } satisfies Partial<Session>);
      Object.assign(e, {
        mode: "sesi",
        activeSessionId: s.id,
        nextSessionId: nextAfter(eventId, s.id),
        stateUpdatedAt: at,
      } satisfies Partial<Event>);
      commit();
      return true;
    },
    // Selesaikan sesi N: N selesai (endedAt), mode=jeda, berikutnya = sesi sesudah N yang belum selesai.
    // Sesi yang nggak lagi jalan → false (idempoten).
    finishSession(eventId: string, sessionId: string, at: string): boolean {
      const e = openEvent(eventId);
      const s = sessionOf(eventId, sessionId);
      if (s.status !== "berlangsung") return false;
      s.status = "selesai";
      s.endedAt = at;
      Object.assign(e, {
        mode: "jeda",
        activeSessionId: null,
        nextSessionId: nextAfter(eventId, s.id),
        stateUpdatedAt: at,
      } satisfies Partial<Event>);
      commit();
      return true;
    },

    // ---- F5 · Tutup acara (BP04 → BP04b) ----
    // Boleh kalau nggak ada sesi yang jalan dan sesi terakhir udah selesai (sesi yang dilewati
    // nggak menghalangi). Sekali jalan: udah ditutup → false, rev tetap (dobel tap / dua HP).
    canClose(eventId: string): boolean {
      return closable(eventId);
    },
    closeEvent(eventId: string, at: string): boolean {
      const e = event(eventId);
      if (e.mode === "closed") return false;
      if (!closable(eventId)) {
        throw new StoreError("sesi-belum-selesai", "Selesaikan sesi terakhir dulu");
      }
      Object.assign(e, {
        mode: "closed",
        activeSessionId: null,
        nextSessionId: null,
        stateUpdatedAt: at,
        closedAt: at,
      } satisfies Partial<Event>);
      commit();
      return true;
    },
    // Dev saja (/dev/states/f5): buka lagi acara yang udah ditutup → jeda.
    reopenEvent(eventId: string, at: string): boolean {
      const e = event(eventId);
      if (e.mode !== "closed") return false;
      Object.assign(e, {
        mode: "jeda",
        closedAt: null,
        stateUpdatedAt: at,
      } satisfies Partial<Event>);
      commit();
      return true;
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
      if (data.photos) data.photos = data.photos.filter((p) => p.guestId !== id);
      if (data.feedback) data.feedback = data.feedback.filter((f) => f.guestId !== id);
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
      if (input.rsvp === "hadir") ensureTicket(g);
      commit();
      return g;
    },
    ticketFor(guestId: string): Ticket | null {
      return data.tickets.find((t) => t.guestId === guestId) ?? null;
    },

    // ---- F2 · Check-in di pintu ----
    // Satu op = satu check-in dari HP panitia (scan P06 / ✓ P07 / walk-in P07c). Op yang sama
    // dikirim ulang (sinyal putus) → hasil sama, hitungan tidak dobel. Dua HP scan tiket yang
    // sama → yang sampai di server duluan menang, yang kedua dapat "sudah-dipakai".
    checkIn(
      eventId: string,
      target: { ticketId: string } | { guestId: string },
      op: CheckInOp,
    ): CheckInResult {
      const done = replay(op.opId);
      if (done) return done;
      if ("ticketId" in target) {
        const t = data.tickets.find((x) => x.ticketId === target.ticketId);
        const g = t && data.guests.find((x) => x.id === t.guestId);
        if (!t || !g || g.eventId !== eventId) return { kind: "tidak-dikenal" };
        return checkInGuest(g, t, op);
      }
      const g = data.guests.find((x) => x.id === target.guestId && x.eventId === eventId);
      if (!g) return { kind: "tidak-dikenal" };
      // RSVP "Nggak bisa"/belum jawab tapi datang → tetap boleh masuk, tiket dibuat di sini.
      return checkInGuest(g, ensureTicket(g), op);
    },

    // P07c · walk-in: tamu baru langsung "Udah masuk" (RSVP hadir, ikut pembagi).
    addWalkIn(eventId: string, input: { name: string; ig: string }, op: CheckInOp): CheckInResult {
      const done = replay(op.opId);
      if (done) return done;
      event(eventId);
      if (input.ig) assertIgFree(eventId, input.ig);
      const g = newGuest(eventId, { name: input.name, ig: input.ig, wa: null }, "walkin");
      g.inviteStatus = "diundang";
      g.invitedAt = op.at;
      g.rsvp = "hadir";
      g.respondedAt = op.at;
      data.guests.push(g);
      return checkInGuest(g, ensureTicket(g), op);
    },

    // Toast "Batalkan" (5 dtk) setelah ✓ manual: tiket aktif lagi, RSVP kembali seperti semula.
    undoCheckIn(opId: string): boolean {
      const t = data.tickets.find((x) => x.opId === opId && x.status === "dipakai");
      if (!t) return false;
      const g = data.guests.find((x) => x.id === t.guestId);
      if (g && t.rsvpBefore && t.rsvpBefore !== "hadir") g.rsvp = t.rsvpBefore;
      Object.assign(t, {
        status: "aktif",
        checkedInAt: null,
        checkedInBy: null,
        method: null,
        guestNo: null,
        opId: null,
        rsvpBefore: null,
      } satisfies Partial<Ticket>);
      commit();
      return true;
    },

    doorStats(eventId: string): DoorStats {
      const guests = guestsOf(eventId);
      const ids = new Set(guests.map((g) => g.id));
      return {
        checkedIn: data.tickets.filter((t) => ids.has(t.guestId) && t.status === "dipakai").length,
        expected: guests.filter((g) => g.rsvp === "hadir").length,
        total: guests.length,
      };
    },

    listTickets(eventId: string): Ticket[] {
      const ids = new Set(guestsOf(eventId).map((g) => g.id));
      return data.tickets.filter((t) => ids.has(t.guestId));
    },

    // ---- N4 · Foto kolase polaroid ----
    // File gambar sudah tersimpan duluan (lib/server/photos); di sini cuma metadata. id = clientId
    // dari HP: kirim ulang (sinyal putus) → foto yang sama, hitungan nggak dobel.
    addPhoto(input: PhotoInput): { photo: Photo; created: boolean } {
      const g = guest(input.guestId);
      const existing = photosOf(g.eventId, true).find((p) => p.id === input.id);
      if (existing) {
        if (existing.guestId !== g.id) throw new StoreError("foto-tidak-ada", "Foto nggak ketemu");
        return { photo: existing, created: false };
      }
      if (event(g.eventId).mode === "closed") {
        throw new StoreError("acara-ditutup", "Acaranya udah ditutup");
      }
      if (photosOf(g.eventId).filter((p) => p.guestId === g.id).length >= MAX_PHOTOS_PER_GUEST) {
        throw new StoreError("foto-penuh", `Maksimal ${MAX_PHOTOS_PER_GUEST} foto per tamu`);
      }
      const photo: Photo = {
        id: input.id,
        eventId: g.eventId,
        guestId: g.id,
        sessionId: currentSessionId(g.eventId),
        createdAt: input.at,
        width: input.width,
        height: input.height,
        bytes: input.bytes,
        deletedAt: null,
      };
      (data.photos ??= []).push(photo);
      commit();
      return { photo, created: true };
    },

    // T15b: hapus foto sendiri, juga setelah acara ditutup (keputusan F5) sampai data dihapus H+30.
    // false = bukan miliknya / udah hilang.
    deletePhoto(guestId: string, id: string, at: string): boolean {
      const p = data.photos?.find((x) => x.id === id && x.guestId === guestId && !x.deletedAt);
      if (!p) return false;
      p.deletedAt = at;
      commit();
      return true;
    },

    getPhoto(id: string): Photo | null {
      return data.photos?.find((p) => p.id === id && !p.deletedAt) ?? null;
    },
    // Foto aktif, terbaru dulu.
    listPhotos(eventId: string): Photo[] {
      return photosOf(eventId);
    },
    photoCount(eventId: string): number {
      return photosOf(eventId).length;
    },
    // BT07: "bareng {others} foto tamu lain" + strip 4 foto tamu lain terbaru + "+{others − 4}".
    photoSummary(eventId: string, guestId: string): PhotoSummary {
      const all = photosOf(eventId);
      const others = all.filter((p) => p.guestId !== guestId);
      return {
        total: all.length,
        others: others.length,
        mine: all.length - others.length,
        latest: others.slice(0, 4).map((p) => p.id),
      };
    },

    // ---- F5 · Buku tamu (T14) & rekap (P11) ----
    // Cuma tamu yang udah masuk, setelah acara ditutup. Satu isian per tamu: kirim ulang id yang
    // sama → isian yang sama (created false, rev tetap); id lain → "sudah-isi".
    addFeedback(
      guestId: string,
      input: FeedbackInput,
      at: string,
    ): { feedback: Feedback; created: boolean } {
      const g = guest(guestId);
      const e = event(g.eventId);
      const same = data.feedback?.find((f) => f.id === input.id);
      if (same) {
        if (same.guestId !== g.id) throw new StoreError("isian-tidak-valid", "Isiannya bentrok");
        return { feedback: same, created: false };
      }
      if (e.purgedAt) throw new StoreError("data-dihapus", "Data acara ini udah dihapus");
      if (e.mode !== "closed") {
        throw new StoreError("acara-belum-ditutup", "Buku tamu kebuka setelah acara ditutup");
      }
      if (data.tickets.find((t) => t.guestId === g.id)?.status !== "dipakai") {
        throw new StoreError("belum-masuk", "Buku tamu buat tamu yang udah datang");
      }
      if (data.feedback?.some((f) => f.guestId === g.id)) {
        throw new StoreError("sudah-isi", "Kamu sudah isi buku tamu");
      }
      const improve = input.improve?.trim() || null;
      if (
        !Number.isInteger(input.rating) ||
        input.rating < 1 ||
        input.rating > 5 ||
        (improve !== null && improve.length > MAX_IMPROVE) ||
        (input.highlightSessionId !== null &&
          !sessionsOf(e.id).some((s) => s.id === input.highlightSessionId))
      ) {
        throw new StoreError("isian-tidak-valid", "Isiannya belum pas");
      }
      const feedback: Feedback = {
        id: input.id,
        eventId: e.id,
        guestId: g.id,
        rating: input.rating,
        highlightSessionId: input.highlightSessionId,
        improve,
        inviteAgain: input.inviteAgain,
        createdAt: at,
      };
      (data.feedback ??= []).push(feedback);
      commit();
      return { feedback, created: true };
    },
    feedbackFor(guestId: string): Feedback | null {
      return data.feedback?.find((f) => f.guestId === guestId) ?? null;
    },
    // Urut waktu isi (untuk CSV).
    listFeedback(eventId: string): Feedback[] {
      return feedbackOf(eventId);
    },
    // P11 / P11b / P11c. Setelah dihapus H+30 (P11d): dari arsip tanpa jawaban per tamu.
    feedbackRecap(eventId: string): FeedbackRecap {
      const e = event(eventId);
      if (e.purgedAt) {
        return { ...emptyRecap(), ...e.recapArchive, improvements: [], purgedAt: e.purgedAt };
      }
      return liveRecap(eventId);
    },

    // Ringkasan Claude. Panggilan Claude-nya di luar store (lib/server/summary): beginSummary
    // menandai "sedang dibuat" dan mengembalikan jawaban tanpa nama; saveSummary menyimpan hasil.
    // null = nggak perlu dibuat (< 3 jawaban, udah segar, atau HP lain lagi membuat).
    beginSummary(
      eventId: string,
      at: string,
      force = false,
    ): { items: FeedbackForSummary[]; basedOn: number } | null {
      const e = event(eventId);
      const list = feedbackOf(eventId);
      if (e.purgedAt || !summaryDue(e.summary, list.length, Date.parse(at), force)) return null;
      e.summary = {
        points: null,
        basedOn: 0,
        createdAt: null,
        error: null,
        errorAt: null,
        ...e.summary,
        pendingSince: at,
      };
      commit();
      const titles = new Map(sessionsOf(eventId).map((s) => [s.id, s.title]));
      return {
        basedOn: list.length,
        items: list.map((f) => ({
          rating: f.rating,
          highlight: f.highlightSessionId ? (titles.get(f.highlightSessionId) ?? null) : null,
          improve: f.improve,
          inviteAgain: f.inviteAgain,
        })),
      };
    },
    // Hasil Claude: poin baru menggantikan yang lama; gagal → poin lama tetap disimpan (P11b
    // tampil kalau belum pernah ada poin).
    saveSummary(
      eventId: string,
      basedOn: number,
      result: { points: string[] } | { error: string },
      at: string,
    ): void {
      const e = event(eventId);
      const prev = e.summary;
      e.summary =
        "points" in result
          ? {
              points: result.points,
              basedOn,
              createdAt: at,
              error: null,
              errorAt: null,
              pendingSince: null,
            }
          : {
              points: prev?.points ?? null,
              basedOn,
              createdAt: prev?.createdAt ?? null,
              error: result.error,
              errorAt: at,
              pendingSince: null,
            };
      commit();
    },

    // ---- F5 · Hapus data per orang H+30 (P11d, prd §8) ----
    // Simpan rekap tanpa nama dulu, lalu hapus isian per tamu, nama/IG/WA tamu (diganti
    // "Tamu #nn", link lama mati karena token diganti), dan metadata foto. Kembalikan id foto
    // supaya pemanggil menghapus filenya (di luar store). Udah pernah → [] dan rev tetap.
    purgePersonalData(eventId: string, at: string): string[] {
      const e = event(eventId);
      if (e.purgedAt) return [];
      const recap = liveRecap(eventId);
      e.recapArchive = { ...recap, improvements: [], purgedAt: at };
      e.purgedAt = at;
      e.dmTemplate = "";
      const photoIds = (data.photos ?? []).filter((p) => p.eventId === eventId).map((p) => p.id);
      if (data.photos) data.photos = data.photos.filter((p) => p.eventId !== eventId);
      if (data.feedback) data.feedback = data.feedback.filter((f) => f.eventId !== eventId);
      for (const g of guestsOf(eventId)) {
        Object.assign(g, {
          name: `Tamu #${String(g.keyNo).padStart(2, "0")}`,
          ig: `tamu${g.keyNo}`,
          wa: null,
          dmTemplate: null,
          token: newToken(),
        } satisfies Partial<Guest>);
      }
      commit();
      return photoIds;
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
