import type { ReactNode } from "react";
import { PertanyaanScreen } from "@/components/n1/Pertanyaan";
import { HMD_ID } from "@/lib/data/seed";
import { questionsView } from "@/lib/questions";
import { acara, demoStore, kontrol, talkshow } from "../f4/screens";
import { DEMO_TEXTS, demoQuestions } from "./questions";

// Registri layar N1 (N1-deliverables.md "Daftar layar", Figma section 4669:4888) untuk
// /dev/states/n1/[code]. Komponen sama dengan route asli, data contoh di memori (store contoh F4:
// 20 tamu, 18 udah masuk, Talkshow jalan sejak 14.00), jam beku, tanpa jaringan.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Kasus" | "Aksi" | "Gagal";
  lane: "Tamu" | "Panitia";
  render: () => ReactNode;
  href?: string; // layar yang udah ada di /dev/states lain
};

const NOW = "14:27:10";
const at = (hhmm: string) => `2026-11-08T${hhmm}+07:00`;

function p10(empty: boolean) {
  const store = demoStore(talkshow);
  const guests = store.listGuests(HMD_ID);
  const list = empty ? [] : demoQuestions(HMD_ID, "s02", guests, at("14:00:00"));
  return (
    <PertanyaanScreen
      eventId={HMD_ID}
      view={questionsView(list, guests, "s02")}
      startsAt="14.00"
      phaseLabel="Hari-H · Live"
    />
  );
}

export const SCREENS: ScreenDef[] = [
  {
    code: "BT21",
    name: "Sesi · Talkshow (titik mulai)",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(talkshow, NOW),
  },
  {
    code: "BT21p",
    name: "Profil pembicara (sheet, F4)",
    kind: "Aksi",
    lane: "Tamu",
    render: () => null,
    href: "/dev/states/f4/BT21p",
  },
  {
    code: "BT08",
    name: "Tanya pembicara (sheet)",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(talkshow, NOW, { sheet: "tanya", tanya: { text: DEMO_TEXTS[0] } }),
  },
  {
    code: "BT09",
    name: "Pertanyaan terkirim (sheet)",
    kind: "Utama",
    lane: "Tamu",
    render: () =>
      acara(talkshow, NOW, {
        sheet: "tanya",
        tanya: {
          sent: [
            { id: "q2", text: DEMO_TEXTS[1]!, time: "14.31", answered: false },
            { id: "q1", text: DEMO_TEXTS[0]!, time: "14.27", answered: true },
          ],
        },
      }),
  },
  {
    code: "BT08b",
    name: "Gagal kirim pertanyaan (sheet + toast)",
    kind: "Gagal",
    lane: "Tamu",
    render: () =>
      acara(talkshow, NOW, { sheet: "tanya", tanya: { text: DEMO_TEXTS[0], failed: true } }),
  },
  {
    code: "BP02",
    name: "Kontrol acara · Talkshow jalan",
    kind: "Utama",
    lane: "Panitia",
    render: () => kontrol(talkshow, NOW, { questions: { total: 23, open: 21 } }),
  },
  {
    code: "P10",
    name: "Pertanyaan (moderator)",
    kind: "Utama",
    lane: "Panitia",
    render: () => p10(false),
  },
  {
    code: "P10c",
    name: "Belum ada pertanyaan",
    kind: "Kasus",
    lane: "Panitia",
    render: () => p10(true),
  },
];
