import type { ReactNode } from "react";
import { KolaseApp } from "@/components/n4/KolaseApp";
import type { CameraStatus } from "@/components/n4/useCamera";
import { demoEvent } from "@/lib/fixtures";
import { polaroidDate, type GuestPhotos } from "@/lib/photo";
import { acara, jeda1 } from "../f4/screens";

// Registri layar N4 v2 (N4-deliverables.md "Daftar layar", Figma 4670:4981 versi 25 Okt) untuk
// /dev/states/n4/[code] (+ BT07dh v3 26 Okt). Komponen sama dengan route asli: kamera (KolaseApp) dan sheet hasil/galeri
// di atas layar acara Jeda (AcaraScreen, data contoh F4), tanpa kamera/server.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Titik mulai" | "Utama" | "Gagal" | "Kasus lain";
  render: () => ReactNode;
};

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const MINE = id(99);
const JEDA = "13:48:00";
const at = (hhmm: string) => `2026-11-08T${hhmm}:00+07:00`;

// Contoh Figma: 34 foto tamu lain → strip 4 + "+30"; Galeri "Foto saya · 3" (13.12, 13.40, 14.18).
const photos = (mine: string[], others: number): GuestPhotos => ({
  name: "Rara",
  endsAt: demoEvent.endsAt,
  mine: mine.map((pid, i) => ({
    id: pid,
    createdAt: at(["14:18", "13:40", "13:12"][i] ?? "13:00"),
  })),
  others,
  latest: Array.from({ length: Math.min(4, others) }, (_, i) => id(i + 1)),
});
const FULL = photos([MINE, id(98), id(97)], 34);
const FIRST = photos([MINE], 0);
const EMPTY = photos([], 34);

const camera = (status?: CameraStatus) => (
  <KolaseApp
    token="demo-token-n4-preview"
    name="Rara"
    date={polaroidDate(demoEvent.date)}
    backHref="/dev/states/n4"
    lastOwnId={status ? null : MINE}
    preview={{ camera: status }}
  />
);

const sheet = (
  data: GuestPhotos,
  photo?: { status: "sent" | "queued"; pending?: number; extraToast?: boolean },
) =>
  acara(jeda1, JEDA, photo ? { sheet: "foto", photoId: MINE, photo } : { sheet: "galeri" }, data);

export const SCREENS: ScreenDef[] = [
  {
    code: "BT03",
    name: "Jeda (home tamu) + FAB kamera",
    kind: "Titik mulai",
    render: () => acara(jeda1, JEDA, {}, FULL),
  },
  { code: "BT06", name: "Kamera kolase", kind: "Utama", render: () => camera() },
  {
    code: "BT07",
    name: "Nempel di kulkas (sheet)",
    kind: "Utama",
    render: () => sheet(FULL, { status: "sent" }),
  },
  { code: "BT06b", name: "Izin kamera ditolak", kind: "Gagal", render: () => camera("denied") },
  {
    code: "BT07b",
    name: "Fotomu lagi antre (sheet)",
    kind: "Gagal",
    render: () => sheet(FULL, { status: "queued", pending: 1 }),
  },
  {
    code: "BT07c",
    name: "Tap +30 sebelum acara selesai",
    kind: "Kasus lain",
    render: () => sheet(FULL, { status: "sent", extraToast: true }),
  },
  {
    code: "BT07d",
    name: "Galeri · Foto saya (sheet)",
    kind: "Kasus lain",
    render: () => sheet(FULL),
  },
  {
    code: "BT07e",
    name: "Foto pertama di kulkas (sheet)",
    kind: "Kasus lain",
    render: () => sheet(FIRST, { status: "sent" }),
  },
  {
    code: "BT07dh",
    name: "Foto dihapus (galeri + toast Batalkan)",
    kind: "Kasus lain",
    // Figma: foto 13.40 dihapus → "Foto saya · 2" (13.12, 14.18) + toast.
    render: () => acara(jeda1, JEDA, { sheet: "galeri", galeri: { pending: id(98) } }, FULL),
  },
  {
    code: "BT07d-kosong",
    name: "Galeri kosong (belum didesain)",
    kind: "Kasus lain",
    render: () => sheet(EMPTY),
  },
  {
    code: "BT06-cadangan",
    name: "Kamera bawaan HP (webview IG / tanpa getUserMedia)",
    kind: "Kasus lain",
    render: () => camera("unsupported"),
  },
];
