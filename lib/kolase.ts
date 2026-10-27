import { sessionShort } from "./data/sessionInfo";
import type { Guest, Photo, Session } from "./data/types";
import { firstName, timeWib } from "./format";

// F5 · kolase kulkas (T15 masonry, T15c gambar 9:16). Logika murni: dipakai komponen Masonry,
// canvas di HP, dan tes.

export const KOLASE_MAX = 12; // foto di gambar 9:16 (ikut filter aktif, terbaru dulu)
export const KOLASE_FILE = "kolase-hmd.jpg";
export const KOLASE_W = 1080;
export const KOLASE_H = 1920;

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

export type KolaseCell = { index: number; x: number; y: number; w: number; h: number };

export type KolaseLayout = {
  columns: number;
  colWidth: number;
  captionH: number;
  cells: KolaseCell[]; // kotak foto (caption di bawahnya, setinggi captionH)
};

// Tata letak gambar 9:16: area foto mulai `top`, 2 kolom (≤ 4 foto) atau 3 kolom, lebar kolom
// dikecilkan sampai kolom tertinggi muat di tinggi yang tersedia; blok foto di tengah horizontal.
export function kolaseLayout(
  ratios: number[], // tinggi/lebar tiap foto
  opts: { width?: number; height?: number; pad?: number; top?: number; gap?: number } = {},
): KolaseLayout {
  const width = opts.width ?? KOLASE_W;
  const height = opts.height ?? KOLASE_H;
  const pad = opts.pad ?? 64;
  const top = opts.top ?? 236;
  const gap = opts.gap ?? 24;
  const captionH = 44;
  const columns = ratios.length <= 4 ? 2 : 3;
  const idx = ratios.map((r, index) => ({ r, index }));
  const cols = masonry(idx, (x) => x.r, columns);
  const availH = height - top - pad;
  const fitW = (width - pad * 2 - gap * (columns - 1)) / columns;
  // Tinggi kolom = w × Σrasio + n × (caption + gap) − gap → cari w terbesar yang muat.
  const fitH = Math.min(
    ...cols
      .filter((c) => c.length)
      .map((c) => {
        const sum = c.reduce((n, x) => n + x.r, 0);
        return (availH - c.length * (captionH + gap) + gap) / sum;
      }),
  );
  const colWidth = Math.floor(Math.min(fitW, Number.isFinite(fitH) ? fitH : fitW));
  const blockW = colWidth * columns + gap * (columns - 1);
  const x0 = Math.round((width - blockW) / 2);
  const cells: KolaseCell[] = [];
  cols.forEach((col, c) => {
    let y = top;
    for (const { r, index } of col) {
      const h = Math.round(colWidth * r);
      cells.push({ index, x: x0 + c * (colWidth + gap), y, w: colWidth, h });
      y += h + captionH + gap;
    }
  });
  return { columns, colWidth, captionH, cells: cells.sort((a, b) => a.index - b.index) };
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

// Filter chip T15: Semua · Fotoku · satu per sesi yang punya foto (urutan rundown).
export type KolaseFilter = "semua" | "fotoku" | `sesi:${string}`;

export function filterPhotos(photos: KolasePhoto[], filter: KolaseFilter): KolasePhoto[] {
  if (filter === "semua") return photos;
  if (filter === "fotoku") return photos.filter((p) => p.mine);
  const id = filter.slice(5);
  return photos.filter((p) => p.sessionId === id);
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
