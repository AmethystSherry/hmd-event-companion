import type { ReactNode } from "react";
import { DoorApp, type ScanSheet } from "@/components/f2/DoorApp";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { DayTicketScreen, type DayPhase } from "@/components/f2/tamu";
import { TicketQr } from "@/components/TicketQr";
import { doorCardCopy, doorCounts, type DoorGuest } from "@/lib/door";
import { demoEvent, demoSessions, NAMES } from "@/lib/fixtures";

// Registri layar F2 (F2-deliverables.md "Daftar layar", Figma band 4667:4654) untuk
// /dev/states/f2/[code]. Komponen layar sama dengan route asli, data contoh, tanpa server.

export type ScreenDef = {
  code: string;
  name: string;
  lane: "Tamu" | "Panitia";
  kind: "Utama" | "Gagal" | "Kasus lain";
  render: () => ReactNode | Promise<ReactNode>;
};

const DEMO_DAY_NOW = new Date("2026-11-08T13:30:00+07:00");
const IN_AT = "2026-11-08T13:04:00+07:00";

// 20 tamu, 9 udah masuk (Rara tamu ke-9, 13.04), Bima RSVP "Nggak bisa" (persis contoh Figma P07).
const INSIDE = new Set([
  "rarawening",
  "dimaspr",
  "sekarayu",
  "nadiakirana",
  "fajar.rmd",
  "citramhr",
  "galihpras",
  "intanpermata",
  "raka.adt",
]);
const demoGuests: DoorGuest[] = NAMES.map(([name, ig], i) => {
  const inside = INSIDE.has(ig);
  return {
    id: `g${String(i + 1).padStart(3, "0")}`,
    name,
    ig,
    keyNo: ig === "rarawening" ? 14 : i + 1,
    rsvp: ig === "bimanug" ? "nggak" : "hadir",
    source: "csv",
    ticketId: `t${i}`,
    shortCode: `HMD-${String(i + 1).padStart(3, "0")}-7F3K`,
    status: inside ? "dipakai" : "aktif",
    checkedInAt: inside ? IN_AT : null,
    guestNo: ig === "rarawening" ? 9 : inside ? 1 : null,
    method: inside ? "scan" : null,
    opId: null,
  };
});
const rara = demoGuests.find((g) => g.ig === "rarawening")!;
const counts = doorCounts(demoGuests);

const qr = () => <TicketQr payload="demo-ticket.0000000000000000" label="QR tiket contoh" />;
const ticket = (phase: DayPhase) => (
  <DayTicketScreen
    phase={phase}
    guestName="Rara Wening"
    event={demoEvent}
    keyNo="#014"
    code="HMD-014-7F3K"
    qr={qr()}
    stamp={phase === "t05" ? null : { time: "13.04", guestNo: 9, total: 20 }}
  />
);

const door = (
  view: "scan" | "cari",
  preview: Omit<Parameters<typeof DoorApp>[0]["preview"] & object, "guests"> = {},
  cameraFailed = false,
) => (
  <DoorApp
    eventId={demoEvent.id}
    eventName={demoEvent.name}
    initialView={view}
    cameraFailed={cameraFailed}
    preview={{ guests: demoGuests, ...preview }}
  />
);

const sheet = (s: ScanSheet) => door("scan", { sheet: s });

export const SCREENS: ScreenDef[] = [
  {
    code: "T05",
    name: "Tiket hari-H (QR, Belum masuk)",
    lane: "Tamu",
    kind: "Utama",
    render: () => ticket("t05"),
  },
  {
    code: "T05a",
    name: "Discan, tiket mulai sobek",
    lane: "Tamu",
    kind: "Utama",
    render: () => ticket("t05a"),
  },
  {
    code: "BT02",
    name: "Tiket sobek · selamat datang",
    lane: "Tamu",
    kind: "Utama",
    render: () => ticket("bt02"),
  },
  {
    code: "T03b",
    name: "Tiket dibuka lagi (QR nonaktif)",
    lane: "Tamu",
    kind: "Kasus lain",
    render: () => ticket("t03b"),
  },
  {
    code: "BP00",
    name: "Kontrol acara · card Pintu masuk",
    lane: "Panitia",
    kind: "Utama",
    render: () => (
      <KontrolScreen
        event={demoEvent}
        sessions={demoSessions}
        checkIn={counts}
        eventDay
        phaseLabel="Hari-H · Live"
        backHref="/dev/states/f2"
        door={doorCardCopy({
          ...counts,
          date: demoEvent.date,
          startsAt: demoEvent.startsAt,
          secondSessionAt: demoSessions[1].startsAt,
          now: DEMO_DAY_NOW,
          eventDay: true,
        })}
      />
    ),
  },
  { code: "P05", name: "Scan tiket", lane: "Panitia", kind: "Utama", render: () => door("scan") },
  {
    code: "P05b",
    name: "Sinyal lemah · antre sinkron",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => door("scan", { pending: 2 }),
  },
  {
    code: "P06",
    name: "Hasil · Valid",
    lane: "Panitia",
    kind: "Utama",
    render: () => sheet({ kind: "valid", guest: rara, guestNo: 9, at: IN_AT, queued: false }),
  },
  {
    code: "P06b",
    name: "Hasil · Sudah dipakai",
    lane: "Panitia",
    kind: "Gagal",
    render: () => sheet({ kind: "sudah-dipakai", guest: rara, at: IN_AT, method: "scan" }),
  },
  {
    code: "P06c",
    name: "Hasil · Tidak dikenal",
    lane: "Panitia",
    kind: "Gagal",
    render: () => sheet({ kind: "tidak-dikenal" }),
  },
  {
    code: "P07",
    name: "Cari nama · check-in manual",
    lane: "Panitia",
    kind: "Utama",
    render: () => door("cari"),
  },
  {
    code: "P07b",
    name: "Kamera error → Cari nama",
    lane: "Panitia",
    kind: "Gagal",
    render: () => door("cari", {}, true),
  },
  {
    code: "P07c",
    name: "Walk-in · tambah tamu cepat",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => door("cari", { query: "budi", walkIn: true }),
  },
];
