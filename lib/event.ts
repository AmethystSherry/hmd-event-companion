import type { Session } from "./data/types";

// Fakta acara (prd.md §1). Jam & nama diambil dari sini, bukan digenerate.
export const EVENT = {
  name: "House Moving Day",
  host: "Potara Studio",
  dateLabel: "Minggu, 8 November 2026",
  dateShort: "Min, 8 Nov",
  timeLabel: "13.00–17.00 WIB",
  location: "Kantor baru Potara",
  startsAt: "2026-11-08T13:00:00+07:00",
  endsAt: "2026-11-08T17:00:00+07:00",
  instagram: "potarastudio",
  // prd.md §8: data per orang dihapus otomatis H+30.
  purgeAt: "2026-12-08T00:00:00+07:00",
} as const;

// Rundown default (prd.md §6) — dummy, bisa diubah panitia (Phase 5).
export const DEFAULT_RUNDOWN: ReadonlyArray<Omit<Session, "status" | "startedAt" | "endedAt">> = [
  {
    id: "s01",
    order: 1,
    title: "Open space",
    tagline: "Keliling rumah baru",
    room: "Ruang 01",
    type: "info",
    startsAt: "13.00",
    durationMin: 60,
    description: "Pintu dibuka. Keliling bebas, ngopi, kenalan sama tetangga baru.",
    speakers: "Tim Potara",
    pic: "TBD",
    points: [],
  },
  {
    id: "s02",
    order: 2,
    title: "Talkshow",
    tagline: "Guest star (menyusul)",
    room: "Ruang 02",
    type: "talkshow",
    startsAt: "14.00",
    durationMin: 45,
    description: "Pindah rumah, pindah cara kerja.",
    speakers: "Guest star (menyusul) & Tim Potara",
    pic: "TBD",
    points: [],
  },
  {
    id: "s03",
    order: 3,
    title: "Tur kantor",
    tagline: "Di sela talkshow",
    room: "Ruang 03",
    type: "info",
    startsAt: "14.45",
    durationMin: 45,
    description: "Kenalan sama rumah baru, satu ruangan demi satu ruangan.",
    speakers: "Tim Potara",
    pic: "TBD",
    points: ["Lobby & dapur", "Studio meeting", "Ruang rapat kecil", "Rooftop"],
  },
  {
    id: "s04",
    order: 4,
    title: "Closing & networking",
    tagline: "Kenalan sama tetangga",
    room: "Ruang 01",
    type: "info",
    startsAt: "15.30",
    durationMin: 90,
    description: "Penutupan, foto bareng, lanjut ngobrol santai.",
    speakers: "Tim Potara",
    pic: "TBD",
    points: [],
  },
];

export function keyLabel(keyNo: number): string {
  return `#${String(keyNo).padStart(3, "0")}`;
}

// Hari-H (WIB): link tamu yang sudah konfirmasi menampilkan T05 Tiket hari-H, bukan T03.
export function isEventDay(now: Date): boolean {
  const wibDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
  return wibDate === EVENT.startsAt.slice(0, 10);
}
