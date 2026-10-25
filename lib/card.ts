import type { Guest, GuestCard } from "./data/types";

// N3 · kartu kenalan (BT05 Tamu di sini, T11 Kartu kamu). Satu sumber tampilan: `Guest.card`;
// tamu yang cuma isi T02 (job/interests teks bebas) dapat kartu turunan. Logika murni (HP & server).

export const ROLE_MAX = 40; // = JOB_MAX T02
export const ASK_MAX = 3; // minat per kartu
export const ASK_ITEM_MAX = 20; // huruf per minat

const clean = (s: string) => s.trim().replace(/\s+/g, " ");

// "UX writing, Kopi; kopi" → ["UX writing", "Kopi"]: pecah koma / titik koma, buang kosong & dobel
// (huruf besar-kecil diabaikan), maks 3, tiap minat dipotong 20 huruf.
export function splitInterests(text: string | null | undefined): string[] {
  const out: string[] = [];
  for (const part of (text ?? "").split(/[,;]/)) {
    const item = clean(part).slice(0, ASK_ITEM_MAX).trim();
    if (item && !hasInterest(out, item)) out.push(item);
    if (out.length === ASK_MAX) break;
  }
  return out;
}

export const hasInterest = (list: string[], item: string) =>
  list.some((x) => x.toLowerCase() === item.toLowerCase());

// Kartu yang tampil: `card` kalau udah pernah disimpan, kalau belum diturunkan dari T02.
export function cardOf(g: Pick<Guest, "card" | "job" | "interests">): GuestCard {
  if (g.card) return { role: g.card.role || null, askAbout: g.card.askAbout.slice(0, ASK_MAX) };
  return {
    role: g.job ? clean(g.job).slice(0, ROLE_MAX) || null : null,
    askAbout: splitInterests(g.interests),
  };
}

// T11 → server: trim, role kosong = null, minat dobel dibuang. Lewat batas = ditolak (bukan dipotong
// diam-diam) — form di HP udah membatasi, jadi yang lewat berarti isian aneh.
export function normalizeCard(input: unknown): GuestCard | null {
  if (!input || typeof input !== "object") return null;
  const { role, askAbout } = input as { role?: unknown; askAbout?: unknown };
  if (role != null && typeof role !== "string") return null;
  if (!Array.isArray(askAbout) || askAbout.some((a) => typeof a !== "string")) return null;
  const r = clean(role ?? "");
  if (r.length > ROLE_MAX) return null;
  const list: string[] = [];
  for (const raw of askAbout as string[]) {
    const item = clean(raw);
    if (item.length > ASK_ITEM_MAX) return null;
    if (item && !hasInterest(list, item)) list.push(item);
  }
  if (list.length > ASK_MAX) return null;
  return { role: r || null, askAbout: list };
}

export const sameCard = (a: GuestCard | null | undefined, b: GuestCard) =>
  !!a && a.role === b.role && a.askAbout.join("\n") === b.askAbout.join("\n");

// Kartu kamu: "@rarawening · Product designer" / "@rarawening · belum isi pekerjaan" (T11e).
export const cardSubtitle = (ig: string, role: string | null) =>
  `@${ig} · ${role || "belum isi pekerjaan"}`;

export type KartuPostResponse =
  { ok: true; card: GuestCard } | { ok: false; error: "acara-selesai" | (string & {}) };
