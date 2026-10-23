import { HMD_ID, seedData } from "./data/seed";
import { computeStats } from "./data/store";
import type { Guest } from "./data/types";
import { toGuestRow } from "./view";

// Data contoh untuk /dev/states/f1 — persis angka di Figma band F1 (20 tamu, 12 diundang,
// 7 hadir, 1 nggak bisa, 4 belum jawab). Fiktif, tidak pernah masuk store.
export const DEMO_ORIGIN = "https://hmd.example";
export const DEMO_NOW = "2026-10-22T09:00:00+07:00"; // H-17 → "17 hari 4 jam"
export const DEMO_NOW_H1 = "2026-11-07T18:18:00+07:00"; // → "18 jam 42 menit"

const seed = seedData(new Date(DEMO_NOW));
export const demoEvent = seed.events[0];
export const demoOtherEvent = seed.events[1];
export const demoSessions = seed.sessions;

export const NAMES: Array<[string, string]> = [
  ["Yoga Saputra", "yogasap"],
  ["Dimas Pratama", "dimaspr"],
  ["Rara Wening", "rarawening"],
  ["Bima Nugraha", "bimanug"],
  ["Laras Putri", "laraspt"],
  ["Sekar Ayu", "sekarayu"],
  ["Nadia Kirana", "nadiakirana"],
  ["Fajar Ramadhan", "fajar.rmd"],
  ["Citra Maharani", "citramhr"],
  ["Galih Prasetyo", "galihpras"],
  ["Intan Permata", "intanpermata"],
  ["Raka Aditya", "raka.adt"],
  ["Sari Lestari", "sarilestari"],
  ["Tegar Wicaksono", "tegarwcks"],
  ["Ayu Wulandari", "ayuwulan"],
  ["Hendra Kusuma", "hendrakus"],
  ["Putri Anjani", "putrianjani"],
  ["Arif Setiawan", "arifstw"],
  ["Maya Safitri", "mayasafitri"],
  ["Kevin Hartono", "kevinhrt"],
];

// Status per baris (urutan Figma P04): 2 belum diundang di atas, lalu Rara hadir, Bima belum
// jawab, Laras nggak bisa, sisanya campuran sampai angkanya cocok.
type S = [Guest["inviteStatus"], Guest["rsvp"]];
const STATUS: S[] = [
  ["belum", "belum"],
  ["belum", "belum"],
  ["diundang", "hadir"],
  ["diundang", "belum"],
  ["diundang", "nggak"],
  ["diundang", "hadir"],
  ["diundang", "hadir"],
  ["diundang", "hadir"],
  ["diundang", "hadir"],
  ["diundang", "hadir"],
  ["diundang", "belum"],
  ["diundang", "belum"],
  ["diundang", "hadir"],
  ["belum", "belum"],
  ["belum", "belum"],
  ["belum", "belum"],
  ["belum", "belum"],
  ["belum", "belum"],
  ["belum", "belum"],
  ["diundang", "belum"],
];

function demoGuests(): Guest[] {
  return NAMES.map(([name, ig], i) => {
    const [inviteStatus, rsvp] = STATUS[i];
    return {
      id: `g${String(i + 1).padStart(3, "0")}`,
      eventId: HMD_ID,
      token: `demo-token-${String(i + 1).padStart(6, "0")}`,
      name,
      ig,
      wa: i === 0 || i === 13 ? null : `628123${String(4567000 + i)}`,
      dmTemplate: null,
      inviteStatus,
      invitedAt: inviteStatus === "diundang" ? "2026-10-20T10:00:00+07:00" : null,
      rsvp,
      respondedAt: rsvp === "belum" ? null : "2026-10-21T10:00:00+07:00",
      followConfirmed: rsvp === "hadir",
      keyNo: i + 1,
      reminderSentAt: null,
      source: i === 19 ? "manual" : "csv",
      createdAt: DEMO_NOW,
    };
  });
}

export function demoGuestView(mutate?: (gs: Guest[]) => void) {
  const guests = demoGuests();
  mutate?.(guests);
  return {
    rows: guests.map((g) => toGuestRow(g, demoEvent, DEMO_ORIGIN)),
    stats: computeStats(guests),
  };
}

export const demoEventWithCsv = {
  ...demoEvent,
  csvImportedAt: DEMO_NOW,
  csvFileName: "tamu-hmd-dummy.csv",
};
