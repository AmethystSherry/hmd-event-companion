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

// Rundown default (prd.md §6) — dummy, bisa diubah panitia. Copy dari Figma BT03/BT08/BT10/BT11/BP01.
// title = nama bagian · tagline = baris undangan T01 · teaser = deskripsi kartu "Selanjutnya" (Jeda)
// topic = judul kartu sesi (Sesi) · speakers = baris pembawa · hosts = inisial avatar.
export const DEFAULT_RUNDOWN: ReadonlyArray<Omit<Session, "status" | "startedAt" | "endedAt">> = [
  {
    id: "s01",
    order: 1,
    title: "Open space",
    tagline: "Keliling rumah baru",
    teaser: "Pintu dibuka. Keliling bebas, ngopi, kenalan sama tetangga baru.",
    topic: "Keliling rumah baru",
    room: "Ruang 01",
    type: "info",
    startsAt: "13.00",
    durationMin: 60,
    description: "",
    speakers: "Dipandu Tim Potara · bebas keliling",
    hosts: ["Tim Potara"],
    pic: "Tim Acara",
    points: [],
  },
  {
    id: "s02",
    order: 2,
    title: "Talkshow",
    tagline: "Guest star (menyusul)",
    teaser: "Pindah rumah, pindah cara kerja — guest star (menyusul) & Tim Potara.",
    topic: "Pindah rumah, pindah cara kerja",
    room: "Ruang 02",
    type: "talkshow",
    startsAt: "14.00",
    durationMin: 45,
    description:
      "Ngobrol santai soal kenapa Potara pindah, apa yang berubah dari cara bikin karya, dan kenapa ruang kerja ikut membentuk ide.",
    speakers: "Guest star (menyusul) · Moderator Tim Potara",
    hosts: ["Guest star", "Tim Potara"],
    pic: "Tim Acara",
    points: [],
  },
  {
    id: "s03",
    order: 3,
    title: "Tur kantor",
    tagline: "Di sela talkshow",
    teaser: "Mulai dari panggung talkshow. Ikuti pemandu bertopi oranye.",
    topic: "Kenalan sama rumah baru",
    room: "Ruang 03",
    type: "info",
    startsAt: "14.45",
    durationMin: 45,
    description: "",
    speakers: "Dipandu Tim Potara · ±40 menit",
    hosts: ["Tim Potara"],
    pic: "Tim Potara",
    points: ["Lobby & dapur", "Studio motion", "Ruang rapat kaca", "Rooftop"],
  },
  {
    id: "s04",
    order: 4,
    title: "Closing & networking",
    tagline: "Kenalan sama tetangga",
    teaser: "Penutupan, foto bareng, lanjut ngobrol santai.",
    topic: "Penutupan & kenalan",
    room: "Ruang 01",
    type: "info",
    startsAt: "15.30",
    durationMin: 90,
    description: "",
    speakers: "Dipandu MC · Tim Potara",
    hosts: ["MC", "Tim Potara"],
    pic: "MC",
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

// Menit (bulat ke atas) dari `now` ke jam "HH.MM" hari acara (WIB). Negatif = sudah lewat.
export function minutesUntil(hhmm: string, now: Date): number {
  const [h, m] = hhmm.split(".").map(Number);
  const target = new Date(
    `${EVENT.startsAt.slice(0, 10)}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+07:00`,
  );
  return Math.ceil((target.getTime() - now.getTime()) / 60000);
}

// "12 menit lagi" · "2 jam lagi" · "3 hari lagi" (sebelum hari-H, untuk uji & persiapan).
export function untilLabel(minutes: number): { value: number; unit: string } {
  if (minutes < 100) return { value: Math.max(0, minutes), unit: "menit lagi" };
  if (minutes < 60 * 48) return { value: Math.round(minutes / 60), unit: "jam lagi" };
  return { value: Math.round(minutes / 1440), unit: "hari lagi" };
}
