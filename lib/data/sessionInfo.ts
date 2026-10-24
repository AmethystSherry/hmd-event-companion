import type { Session, StoreData } from "./types";

// F4 · info layar acara tamu per sesi rundown House Moving Day (Figma C18 4899:12734).
// Dipakai seed dan untuk melengkapi store lama (.data/store.json / Supabase) yang dibuat sebelum
// F3/F4: field yang masih kosong diisi, nilai seed lama yang belum diubah panitia diganti copy
// Figma (K3). Nilai yang sudah diubah panitia nggak disentuh.
export const HMD_EVENT_ID = "hmd-2026";

type Info = Pick<Session, "room" | "roomNote" | "description" | "speaker" | "topic" | "art">;

export const HMD_SESSION_INFO: Record<string, Info> = {
  s01: {
    room: "Ruang 01",
    roomNote: "lantai 1",
    description: "Keliling rumah baru, ngopi di dapur, kenalan sama tamu lain.",
    speaker: null,
    topic: null,
    art: "open-space",
  },
  s02: {
    room: "Ruang 02",
    roomNote: null,
    description: null, // BT22 pakai topik
    speaker: { name: "Alfin Ganteng", ig: "alfinganteng", label: "Guest star" },
    topic: "Cara pakai AI tanpa ngabisin air di rumah",
    art: "talkshow",
  },
  s03: {
    room: "Ruang 03",
    roomNote: null,
    description: "Keliling ruang kerja baru bareng tim Potara.",
    speaker: null,
    topic: null,
    art: "office-tour",
  },
  s04: {
    room: "Ruang 01",
    roomNote: null,
    description: "Penutupan, foto bareng, dan kenalan sama tetangga.",
    speaker: null,
    topic: null,
    art: "closing",
  },
};

// Seed lama (sebelum 25 Okt) → copy Figma. Hanya kalau nilainya masih persis seed lama.
const RENAMED: Record<string, Partial<Record<"title" | "tagline" | "pic", [string, string]>>> = {
  s01: { title: ["Pintu dibuka & open space", "Open space"] },
  s02: { tagline: ["Guest star (menyusul)", "Bareng Alfin Ganteng"] },
  s04: { pic: ["Tim Potara", "MC"] },
};

// Melengkapi data di tempat (tanpa commit / rev): idempoten, aman dipanggil tiap store dimuat.
export function backfillSessionInfo(data: StoreData): void {
  for (const s of data.sessions) {
    if (s.eventId !== HMD_EVENT_ID) continue;
    const info = HMD_SESSION_INFO[s.id];
    if (!info) continue;
    for (const key of Object.keys(info) as (keyof Info)[]) {
      if (s[key] === undefined) Object.assign(s, { [key]: info[key] });
    }
    for (const [key, [from, to]] of Object.entries(RENAMED[s.id] ?? {}) as [
      "title" | "tagline" | "pic",
      [string, string],
    ][]) {
      if (s[key] === from) s[key] = to;
    }
  }
}
