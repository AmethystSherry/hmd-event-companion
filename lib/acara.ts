import type { Event, Guest, Session, Ticket } from "./data/types";
import { cardOf } from "./card";
import { eventStart } from "./format";
import { rundownView, type SessionView } from "./rundown";

// F4 · data layar acara tamu (/t/[token]/acara): SESI ⇄ JEDA dari state acara, Tiket acara (v3)
// + BT05 Tamu di sini. Logika murni & bisa diserialisasi (server → klien, juga snapshot offline di localStorage).
// Data tamu lain cuma nama, IG, kartu, dan status datang — tanpa WA, token, atau nomor kunci (K8).

export type AcaraGuest = {
  id: string;
  name: string;
  ig: string;
  role: string | null;
  askAbout: string[];
  here: boolean; // udah check-in
  arrivedAt: string | null;
};

// F4 v3 · Tiket acara (geser): sesi selesai = sobekan, sekarang (jalan) / berikutnya / sebentar
// lagi mulai (BT03s) / nanti = tiket penuh.
export type TicketState = "done" | "now" | "next" | "soon" | "later";

export type EventTicket = {
  id: string;
  no: number;
  title: string;
  startsAt: string;
  endsAt: string;
  room: string | null;
  state: TicketState;
};

export type AcaraView = {
  mode: "sesi" | "jeda"; // "pre" (sebelum sesi 1) = jeda dengan Berikutnya = sesi 1
  sessions: SessionView[];
  active: SessionView | null;
  next: SessionView | null;
  done: number;
  finale: boolean; // jeda terakhir: semua sesi selesai, acara belum ditutup
  tickets: EventTicket[]; // urut rundown; komponen yang menumpuk sobekan di kiri
  soon: boolean; // BT03s: jeda, jam mulai sesi berikutnya udah lewat, panitia belum mulai (K14)
  soonAt: string | null; // jam mulai terjadwal sesi berikutnya (selagi belum "soon") → refresh di HP
  loadedAt: string; // jam server saat data dimuat → "Info sesi terakhir 13.58" (S01)
  rev: number; // snapshot offline: yang lebih baru menang
  me: AcaraGuest & { keyNo: number };
  guests: AcaraGuest[]; // tamu lain di BT05, urut: terbaru datang → belum datang
  total: number; // "20 tamu · 18 udah di sini" (termasuk kamu)
  hereCount: number;
};

type Input = {
  event: Event;
  sessions: Session[];
  guests: Guest[]; // semua tamu event
  tickets: Ticket[];
  me: Guest;
  now: Date;
  rev: number;
};

export function acaraView({ event, sessions, guests, tickets, me, now, rev }: Input): AcaraView {
  const r = rundownView(event, sessions);
  const ticketOf = new Map(tickets.map((t) => [t.guestId, t]));
  const toGuest = (g: Guest): AcaraGuest => {
    const t = ticketOf.get(g.id);
    const here = t?.status === "dipakai";
    return {
      id: g.id,
      name: g.name,
      ig: g.ig,
      ...cardOf(g), // N3: role + askAbout (kartu T11, atau turunan isian T02)
      here,
      arrivedAt: here ? (t?.checkedInAt ?? null) : null,
    };
  };
  // K8: yang tampil = RSVP hadir atau udah check-in (walk-in ikut).
  const listed = guests.filter(
    (g) => g.rsvp === "hadir" || ticketOf.get(g.id)?.status === "dipakai",
  );
  const others = listed
    .filter((g) => g.id !== me.id)
    .map(toGuest)
    .sort((a, b) => {
      if (a.here !== b.here) return a.here ? -1 : 1;
      if (a.here) return (b.arrivedAt ?? "").localeCompare(a.arrivedAt ?? "");
      return a.name.localeCompare(b.name, "id");
    });
  const self = toGuest(me);
  const nextStart = !r.active && r.next ? eventStart(event.date, r.next.startsAt) : null;
  const soon = !!nextStart && now.getTime() >= nextStart.getTime();
  return {
    mode: r.active ? "sesi" : "jeda",
    sessions: r.sessions,
    active: r.active,
    next: r.next,
    done: r.done,
    finale: !r.active && !r.next && r.sessions.length > 0 && r.done > 0,
    tickets: r.sessions.map((s) => ({
      id: s.id,
      no: s.no,
      title: s.title,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      room: s.room,
      state:
        s.state === "selesai"
          ? "done"
          : s.state === "berlangsung"
            ? "now"
            : s.state === "berikutnya"
              ? soon
                ? "soon"
                : "next"
              : "later",
    })),
    soon,
    soonAt: nextStart && !soon ? nextStart.toISOString() : null,
    loadedAt: now.toISOString(),
    rev,
    me: { ...self, keyNo: me.keyNo },
    guests: others,
    total: others.length + 1,
    hereCount: others.filter((g) => g.here).length + (self.here ? 1 : 0),
  };
}

// BT05 · cari nama / @instagram (filter lokal).
export function filterGuests(list: AcaraGuest[], query: string): AcaraGuest[] {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return list;
  return list.filter((g) => g.name.toLowerCase().includes(q) || g.ig.includes(q));
}

// BT04 · subjudul baris rundown tamu.
export function rundownSubtitle(s: SessionView): string {
  if (s.state === "selesai") return "Selesai";
  if (s.state === "berlangsung") return s.room ? `Sedang berjalan · ${s.room}` : "Sedang berjalan";
  if (s.state === "berikutnya") return `Berikutnya · ${s.speaker?.name ?? s.room ?? s.pic}`;
  return s.room ?? s.pic;
}
