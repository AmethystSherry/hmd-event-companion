import { sessionShort } from "./data/sessionInfo";
import type { Guest, Photo, Session } from "./data/types";
import { firstName, timeWib } from "./format";

// F5 · kolase foto (T15 masonry, T15c gambar 9:16 dinding acak). Logika murni: dipakai komponen Masonry,
// canvas di HP, dan tes.

export const KOLASE_MAX = 80; // foto di gambar 9:16; lebih dari ini → diambil acak per susunan
export const KOLASE_FILE = "kolase-hmd.jpg";
export const KOLASE_W = 1080;
export const KOLASE_H = 1920;
export const KOLASE_THUMB_MAX = 300; // sel foto ≤ ini (sisi panjang) cukup pakai thumbnail 320

// Bagi item ke kolom: tiap item masuk kolom yang paling pendek (urutan terbaru tetap di atas).
// `height` dalam satuan lebar kolom (rasio tinggi/lebar + tinggi caption relatif).
export function masonry<T>(items: T[], height: (item: T) => number, columns = 2): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => []);
  const sums = new Array<number>(columns).fill(0);
  for (const item of items) {
    let i = 0;
    for (let c = 1; c < columns; c++) if (sums[c] < sums[i] - 1e-9) i = c;
    cols[i].push(item);
    sums[i] += height(item);
  }
  return cols;
}

// Acak yang bisa diulang (mulberry32): seed sama → susunan sama, tombol "Acak" = seed baru.
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(items: T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Sel kolase dinding: kotak foto (sudah dikurangi celah) + kemiringan kecil (derajat) +
// `paper` = lebar kertas putih di belakang foto (0 = foto langsung nempel).
export type WallCell = {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  paper: number;
};

// Kolase dinding 9:16 (feedback 30 Okt, ref. dinding guntingan foto): bidang dibagi acak terus-
// menerus (kotak terbesar dibelah di sisi panjangnya, 36–64%) sampai jumlahnya = jumlah foto, jadi
// seluruh bidang terisi dan ukuran foto beragam. Urutan foto diacak juga. Seed sama → hasil sama.
export function kolaseWall(
  count: number,
  seed: number,
  opts: { width?: number; height?: number; pad?: number; bottom?: number } = {},
): WallCell[] {
  if (count <= 0) return [];
  const width = opts.width ?? KOLASE_W;
  const height = opts.height ?? KOLASE_H;
  const pad = opts.pad ?? 28;
  const bottom = opts.bottom ?? 172; // pita label "potara · HMD" di bawah
  const rand = seededRandom(seed);
  type Rect = { x: number; y: number; w: number; h: number };
  const rects: Rect[] = [{ x: pad, y: pad, w: width - pad * 2, h: height - pad - bottom }];
  while (rects.length < count) {
    // Kotak terbesar (luas diberi goyangan) yang dibelah → ukuran nggak seragam.
    let pick = 0;
    let best = -1;
    rects.forEach((r, i) => {
      const score = r.w * r.h * (0.25 + rand() * 1.5);
      if (score > best) [best, pick] = [score, i];
    });
    const r = rects[pick];
    const t = 0.32 + rand() * 0.36;
    const ratio = r.w / r.h;
    const vertical = ratio > 1.2 || (ratio > 0.83 && rand() < 0.5); // belah kiri-kanan
    if (vertical) {
      const w = Math.round(r.w * t);
      rects.splice(pick, 1, { ...r, w }, { ...r, x: r.x + w, w: r.w - w });
    } else {
      const h = Math.round(r.h * t);
      rects.splice(pick, 1, { ...r, h }, { ...r, y: r.y + h, h: r.h - h });
    }
  }
  const order = shuffled(
    Array.from({ length: count }, (_, i) => i),
    rand,
  );
  return rects.map((r, i) => {
    const short = Math.min(r.w, r.h);
    const gap = Math.max(2, Math.min(6, short * 0.025)) + rand() * 2.5; // tiap sisi
    const paper = rand() < 0.55 ? Math.round(Math.max(3, Math.min(12, short * 0.04))) : 0;
    const inset = gap + paper;
    return {
      index: order[i],
      x: Math.round(r.x + inset),
      y: Math.round(r.y + inset),
      w: Math.round(r.w - inset * 2),
      h: Math.round(r.h - inset * 2),
      rot: (rand() - 0.5) * (short > 400 ? 1.6 : 3),
      paper,
    };
  });
}

// Satu foto di kolase T15 (tanpa token / URL: HP menurunkannya dari id).
export type KolasePhoto = {
  id: string;
  mine: boolean;
  name: string; // nama lengkap (T15b)
  first: string; // nama depan (caption)
  sessionId: string | null;
  session: string | null; // label pendek sesi (sessionShort)
  time: string; // "14.27"
  width: number;
  height: number;
  tone: number; // placeholder gradasi 0–3
};

// Warna placeholder tetap per foto (dari id), supaya nggak berubah tiap render.
export function photoTone(id: string): number {
  let n = 0;
  for (const ch of id) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return n % 4;
}

// Caption pin: "Rara · Talkshow" (tanpa sesi = nama saja).
export function pinCaption(p: Pick<KolasePhoto, "first" | "session">): string {
  return p.session ? `${p.first} · ${p.session}` : p.first;
}

// Filter chip T15: Semua · Foto saya · satu per sesi yang punya foto (urutan rundown).
export type KolaseFilter = "semua" | "fotoku" | `sesi:${string}`;

export function filterPhotos(photos: KolasePhoto[], filter: KolaseFilter): KolasePhoto[] {
  if (filter === "semua") return photos;
  if (filter === "fotoku") return photos.filter((p) => p.mine);
  const id = filter.slice(5);
  return photos.filter((p) => p.sessionId === id);
}

// Potongan nama file: "Open Space" → "open-space" (unduh foto T15 & ZIP P13).
export function fileSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Foto ke-n (urut lama → baru) waktu diunduh: "03-rara-talkshow.jpg".
export function photoFileName(p: Pick<KolasePhoto, "first" | "session">, n: number): string {
  return `${String(n).padStart(2, "0")}-${fileSlug(p.first)}-${fileSlug(p.session ?? "acara")}.jpg`;
}

// Foto store → foto kolase (server). Terbaru dulu, ikut urutan listPhotos.
export function toKolasePhotos(
  photos: Photo[],
  guests: Pick<Guest, "id" | "name">[],
  sessions: Pick<Session, "id" | "title" | "shortTitle">[],
  meId: string | null,
): KolasePhoto[] {
  const names = new Map(guests.map((g) => [g.id, g.name]));
  const titles = new Map(sessions.map((x) => [x.id, sessionShort(x)])); // label pendek (K4)
  return photos.map((p) => {
    const name = names.get(p.guestId) ?? "Tamu";
    return {
      id: p.id,
      mine: p.guestId === meId,
      name,
      first: firstName(name),
      sessionId: p.sessionId,
      session: p.sessionId ? (titles.get(p.sessionId) ?? null) : null,
      time: timeWib(p.createdAt),
      width: p.width,
      height: p.height,
      tone: photoTone(p.id),
    };
  });
}
