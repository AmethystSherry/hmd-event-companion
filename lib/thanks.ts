import type { Guest, Ticket } from "./data/types";
import { firstName } from "./format";
import { fillTemplate, waLink } from "./invite";

// F5 v2 · P12 Kirim makasih via WA (tab "Makasih" di Tamu & undangan). Panitia kirim manual satu-satu
// lewat wa.me, sama pola pengingat H-1 (P04b). Logika murni: dipakai halaman panitia & tes.

// Copy Figma P12 (read-only, K13). {nama} = nama depan, {link} = link buku tamu tamu itu.
export const THANKS_TEMPLATE =
  "Makasih udah mampir ke rumah baru, {nama}! Isi buku tamu ± 1 menit & lihat kolase kulkasnya di sini: {link}";

// Link di pesan makasih: buka buku tamu (sheet di BT12, atau kolase kalau udah isi).
export function thanksLink(origin: string, token: string): string {
  return `${origin}/t/${token}/buku-tamu?dari=wa`;
}

export function thanksMessage(name: string, link: string): string {
  return fillTemplate(THANKS_TEMPLATE, { nama: firstName(name), link });
}

export type ThanksRow = {
  id: string;
  name: string;
  sentAt: string | null; // Badge "Terkirim"
  waHref: string | null; // null = tamu tanpa nomor WA (walk-in) → "Nggak ada WA" (K10)
};

export type ThanksView = {
  rows: ThanksRow[]; // tamu yang udah masuk, urut nama
  total: number; // "{n} tamu yang datang"
  sent: number; // "{x}/{n} terkirim"; semua terkirim → ikon cek (K11)
};

// Daftar P12: tamu yang udah check-in, urut nama (huruf besar-kecil & aksen diabaikan).
export function thanksView(
  guests: Pick<Guest, "id" | "name" | "wa" | "token" | "thanksSentAt">[],
  tickets: Pick<Ticket, "guestId" | "status">[],
  origin: string,
): ThanksView {
  const inside = new Set(tickets.filter((t) => t.status === "dipakai").map((t) => t.guestId));
  const rows = guests
    .filter((g) => inside.has(g.id))
    .sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }))
    .map((g) => ({
      id: g.id,
      name: g.name,
      sentAt: g.thanksSentAt ?? null,
      waHref: g.wa ? waLink(g.wa, thanksMessage(g.name, thanksLink(origin, g.token))) : null,
    }));
  return { rows, total: rows.length, sent: rows.filter((r) => r.sentAt).length };
}
