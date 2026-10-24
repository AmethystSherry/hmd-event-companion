import { DEFAULT_DM_TEMPLATE } from "../invite";
import { HMD_EVENT_ID, HMD_SESSION_INFO } from "./sessionInfo";
import { emptyData } from "./store";
import type { Session, StoreData } from "./types";

// Data awal: House Moving Day (rundown default, belum ada tamu — CSV diunggah lewat P04k)
// + satu event dummy kosong supaya PE01 menampilkan lebih dari satu kartu (G14).
export const HMD_ID = HMD_EVENT_ID;
export const LOCATION = "Kantor baru Potara";

const RUNDOWN: Array<Omit<Session, "id" | "eventId">> = [
  {
    title: "Open space",
    tagline: "Keliling rumah baru",
    startsAt: "13.00",
    durationMin: 60,
    type: "info",
    pic: "Tim Acara",
  },
  {
    title: "Talkshow",
    tagline: "Bareng Alfin Ganteng",
    startsAt: "14.00",
    durationMin: 45,
    type: "talkshow",
    pic: "Tim Acara",
  },
  {
    title: "Tur kantor",
    tagline: "Di sela talkshow",
    startsAt: "14.45",
    durationMin: 45,
    type: "info",
    pic: "Tim Potara",
  },
  {
    title: "Closing & networking",
    tagline: "Kenalan sama tetangga",
    startsAt: "15.30",
    durationMin: 90,
    type: "info",
    pic: "MC",
  },
];

export function seedData(now = new Date()): StoreData {
  const data = emptyData();
  const createdAt = now.toISOString();
  data.events.push(
    {
      id: HMD_ID,
      name: "House Moving Day",
      date: "2026-11-08",
      startsAt: "13.00",
      endsAt: "17.00",
      location: LOCATION,
      csvImportedAt: null,
      csvFileName: null,
      dmTemplate: DEFAULT_DM_TEMPLATE,
      createdAt,
    },
    {
      id: "open-studio",
      name: "Potara Open Studio",
      date: "2026-12-12",
      startsAt: "13.00",
      endsAt: "17.00",
      location: LOCATION,
      csvImportedAt: null,
      csvFileName: null,
      dmTemplate: DEFAULT_DM_TEMPLATE,
      createdAt,
    },
  );
  data.sessions.push(
    ...RUNDOWN.map((s, i) => {
      const id = `s0${i + 1}`;
      return { ...s, ...HMD_SESSION_INFO[id], id, eventId: HMD_ID };
    }),
  );
  return data;
}
