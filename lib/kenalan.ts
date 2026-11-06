import type { DataStore } from "./data/store";
import { eventStarted } from "./data/eventState";
import type { Event, Guest, Introduction } from "./data/types";
import { firstName, timeWib } from "./format";

// N5 · Kenalan & hadiah: hitungan, peringkat, dan data layar (murni, bisa diserialisasi).
// Tiap pasangan = +1 kenalan buat dua-duanya. (6 Nov) Peringkat pakai point: yang scan (ngajak
// kenalan) +2, yang discan +1. Point turun; seri → yang lebih dulu sampai angka itu (kenalan
// terakhirnya lebih awal) di atas (K10); masih seri → nama.

export const SCAN_POINTS = 2;
export const SCANNED_POINTS = 1;

// File selfie di storage foto: `{eventId}/kenalan/{id}.jpg` (lib/server/photos menerima id ber-folder).
export const kenalanFileId = (id: string) => `kenalan/${id}`;

// URL gambar selfie lewat route proxy (cuma 2 tamu di pasangan itu).
export const kenalanSelfieUrl = (token: string, id: string, thumb = false) =>
  `/api/t/${token}/kenalan/${id}${thumb ? "?v=thumb" : ""}`;

// Pasangan unik a-b = b-a.
export const pairOf = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);

// Bisa kenalan sekarang? Setelah event dimulai sampai pemenang diumumin / acara ditutup (K9).
export function kenalanOpen(e: Event): boolean {
  return eventStarted(e) && e.mode !== "closed" && !e.kenalanWinner && !e.purgedAt;
}

export type KenalanRow = {
  rank: number; // 1, 2, 3 … (unik setelah tiebreak)
  guestId: string;
  name: string;
  firstName: string;
  count: number; // jumlah kenalan
  points: number; // scan +2, discan +1
  lastAt: string; // kenalan terakhir (ISO)
  lastLabel: string; // "14.32"
};

// Urutan papan (P14) dari daftar kenalan satu event. Cuma tamu dengan ≥ 1 kenalan.
export function kenalanRanking(
  intros: Introduction[],
  guests: Pick<Guest, "id" | "name">[],
): KenalanRow[] {
  const stat = new Map<string, { count: number; points: number; lastAt: string }>();
  for (const i of intros) {
    for (const id of [i.a, i.b]) {
      const s = stat.get(id) ?? { count: 0, points: 0, lastAt: "" };
      s.count += 1;
      s.points += id === i.scannerId ? SCAN_POINTS : SCANNED_POINTS;
      if (i.createdAt > s.lastAt) s.lastAt = i.createdAt;
      stat.set(id, s);
    }
  }
  const names = new Map(guests.map((g) => [g.id, g.name]));
  return [...stat.entries()]
    .filter(([id]) => names.has(id))
    .map(([guestId, s]) => ({ guestId, name: names.get(guestId)!, ...s }))
    .sort(
      (x, y) =>
        y.points - x.points ||
        x.lastAt.localeCompare(y.lastAt) ||
        x.name.localeCompare(y.name, "id"),
    )
    .map((r, i) => ({
      rank: i + 1,
      guestId: r.guestId,
      name: r.name,
      firstName: firstName(r.name),
      count: r.count,
      points: r.points,
      lastAt: r.lastAt,
      lastLabel: timeWib(r.lastAt),
    }));
}

const checkedInIds = (store: DataStore, eventId: string) =>
  new Set(
    store
      .listTickets(eventId)
      .filter((t) => t.status === "dipakai")
      .map((t) => t.guestId),
  );

export type KenalanWinnerView = {
  guestId: string;
  name: string;
  firstName: string;
  count: number;
  points: number;
  announcedAt: string;
  by: string | null;
};

function winnerView(store: DataStore, e: Event): KenalanWinnerView | null {
  const w = e.kenalanWinner;
  if (!w) return null;
  const g = store.getGuest(w.guestId);
  const name = g?.name ?? "Tamu";
  return {
    guestId: w.guestId,
    name,
    firstName: firstName(name),
    count: w.count,
    points: w.points ?? w.count, // pemenang sebelum point (6 Nov) = jumlah kenalan
    announcedAt: w.announcedAt,
    by: w.by,
  };
}

// P14 Papan kenalan + badge BP02k.
export type KenalanBoard = {
  rows: KenalanRow[];
  pairs: number; // "23 pasang kenalan" (badge HadiahFloat panitia, K15)
  joined: number; // "18 tamu ikutan" = tamu dengan ≥ 1 kenalan (T7)
  open: boolean;
  winner: KenalanWinnerView | null;
  tie: boolean; // #1 & #2 sama point-nya (K10: yang duluan sampai menang)
};

export function kenalanBoard(store: DataStore, eventId: string): KenalanBoard {
  const e = store.getEvent(eventId);
  const intros = store.listIntroductions(eventId);
  const rows = kenalanRanking(intros, store.listGuests(eventId));
  return {
    rows,
    pairs: intros.length,
    joined: rows.length,
    open: e ? kenalanOpen(e) : false,
    winner: e ? winnerView(store, e) : null,
    tie: rows.length > 1 && rows[0].points === rows[1].points,
  };
}

// Data N5 untuk HP satu tamu (banner Hadiah, BT05k, BTk1/BTk2, BTk4, BTk5, Leaderboard). Tanpa WA/token.
export type KenalanView = {
  open: boolean; // tombol Kenalan & scan aktif
  inside: boolean; // tamu ini udah check-in (belum = fitur disembunyikan, K7)
  count: number; // jumlah kenalan
  points: number; // scan +2, discan +1 (peringkat pakai ini)
  rank: number | null; // null = belum punya kenalan
  of: number; // "dari 18" = tamu udah check-in (T7)
  top: { firstName: string; points: number } | null;
  latest: KenalanIntro | null; // kenalan terbaru yang melibatkan aku (BTk2 → BTk4)
  winner: (KenalanWinnerView & { isMe: boolean }) | null;
  // (6 Nov) Papan lengkap (nama depan & lengkap, jumlah, jam terakhir) → milestone BT05k + sheet
  // Leaderboard tamu (nama tamu emang udah tampil di Tamu di sini).
  rows: KenalanRow[];
};

export type KenalanIntro = {
  id: string;
  no: number; // "Kenalan ke-{no} hari ini"
  friendId: string;
  friendName: string;
  friendFirstName: string;
  myFirstName: string;
  at: string;
  scannedByMe: boolean;
};

function introsOf(store: DataStore, eventId: string, guestId: string): Introduction[] {
  return store
    .listIntroductions(eventId)
    .filter((i) => i.a === guestId || i.b === guestId)
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

function toIntro(store: DataStore, me: Guest, i: Introduction, no: number): KenalanIntro {
  const friendId = i.a === me.id ? i.b : i.a;
  const friendName = store.getGuest(friendId)?.name ?? "Tamu";
  return {
    id: i.id,
    no,
    friendId,
    friendName,
    friendFirstName: firstName(friendName),
    myFirstName: firstName(me.name),
    at: i.createdAt,
    scannedByMe: i.scannerId === me.id,
  };
}

export function kenalanView(store: DataStore, guestId: string): KenalanView | null {
  const me = store.getGuest(guestId);
  const e = me && store.getEvent(me.eventId);
  if (!me || !e) return null;
  const inside = store.ticketFor(me.id)?.status === "dipakai";
  const mine = introsOf(store, e.id, me.id);
  const rows = kenalanRanking(store.listIntroductions(e.id), store.listGuests(e.id));
  const row = rows.find((r) => r.guestId === me.id);
  const last = mine[mine.length - 1];
  const w = winnerView(store, e);
  return {
    open: inside && kenalanOpen(e),
    inside,
    count: mine.length,
    points: row?.points ?? 0,
    rank: row?.rank ?? null,
    of: checkedInIds(store, e.id).size,
    top: rows[0] ? { firstName: rows[0].firstName, points: rows[0].points } : null,
    latest: last ? toIntro(store, me, last, mine.length) : null,
    winner: w ? { ...w, isMe: w.guestId === me.id } : null,
    rows,
  };
}

// (6 Nov) BT05k progress: fill = point-ku ÷ teratas; milestone = tamu tepat di atasku, #2, #1 (dobel /
// posisi sama dibuang, maks 3).
export type RankMilestone = { rank: number; points: number; pct: number };
export type RankProgress = {
  pct: number; // 0–100
  milestones: RankMilestone[]; // urut kiri → kanan
};

export function rankProgress(v: {
  points: number;
  rank: number | null;
  rows: Pick<KenalanRow, "rank" | "points">[];
}): RankProgress {
  const topPoints = v.rows[0]?.points ?? 0;
  const pctOf = (n: number) => (topPoints > 0 ? Math.min(100, (n / topPoints) * 100) : 0);
  const above = v.rank ? v.rank - 1 : v.rows.length; // 0 kenalan: tamu terakhir di papan
  const wanted = [...new Set([above, 2, 1])].filter((r) => r >= 1 && (!v.rank || r < v.rank));
  const milestones: RankMilestone[] = [];
  for (const rank of wanted.sort((a, b) => a - b)) {
    const row = v.rows.find((x) => x.rank === rank);
    if (!row || milestones.some((m) => m.points === row.points)) continue;
    milestones.push({ rank, points: row.points, pct: pctOf(row.points) });
  }
  milestones.sort((a, b) => a.pct - b.pct || b.rank - a.rank);
  return { pct: pctOf(v.points), milestones: milestones.slice(-3) };
}

// BTk4 · satu kenalan milik tamu ini (null = bukan pasangannya / nggak ada).
export function kenalanIntro(store: DataStore, guestId: string, id: string): KenalanIntro | null {
  const me = store.getGuest(guestId);
  if (!me) return null;
  const mine = introsOf(store, me.eventId, me.id);
  const idx = mine.findIndex((i) => i.id === id);
  return idx < 0 ? null : toIntro(store, me, mine[idx], idx + 1);
}

// ---- Pesan error (layar scan BTk1 & kirim selfie BTk3) ----
export type KenalanError =
  | "qr-tiket"
  | "qr-asing"
  | "qr-sendiri"
  | "udah-kenalan"
  | "belum-check-in"
  | "teman-belum-check-in"
  | "belum-mulai"
  | "papan-dikunci"
  | "acara-selesai"
  | "data-dihapus"
  | "kebanyakan"
  | "foto-rusak"
  | "link";

export function kenalanMessage(
  error: KenalanError,
  ctx: { friendFirstName?: string; at?: string } = {},
): string {
  const nama = ctx.friendFirstName ?? "Temanmu";
  switch (error) {
    case "qr-tiket":
      return "Ini QR tiket. Minta temanmu buka tab QR saya, ya.";
    case "qr-asing":
      return "QR-nya nggak dikenal. Minta temanmu buka tab QR saya, ya."; // TODO copy
    case "qr-sendiri":
      return "Itu QR kamu sendiri. Scan QR temanmu, ya."; // TODO copy
    case "udah-kenalan":
      return ctx.at
        ? `Kamu udah kenalan sama ${nama} jam ${timeWib(ctx.at)}.`
        : `Kamu udah kenalan sama ${nama}.`;
    case "belum-check-in":
      return "Check-in dulu di pintu, ya."; // TODO copy
    case "teman-belum-check-in":
      return `${nama} belum check-in di pintu.`;
    case "belum-mulai":
      return "Kenalan kebuka pas acara udah mulai."; // TODO copy
    case "papan-dikunci":
    case "acara-selesai":
      return "Papan kenalan udah ditutup.";
    case "data-dihapus":
      return "Data acara ini udah dihapus.";
    case "kebanyakan":
      return "Kebanyakan scan barengan, tunggu sebentar."; // TODO copy
    case "foto-rusak":
      return "Selfie-nya nggak bisa dibaca. Coba jepret lagi."; // TODO copy
    case "link":
      return "Link nggak valid.";
  }
}

export type KenalanCekResponse =
  | { ok: true; friend: { id: string; name: string; firstName: string } }
  | { ok: false; error: KenalanError; message: string };

export type KenalanPostResponse =
  { ok: true; id: string } | { ok: false; error: KenalanError; message: string };
