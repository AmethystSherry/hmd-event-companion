import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ConfirmForm } from "@/components/f1/ConfirmForm";
import { EventHome } from "@/components/f1/EventHome";
import { InviteGate } from "@/components/f1/Envelope";
import { EventList } from "@/components/f1/EventList";
import { GuestImport } from "@/components/f1/GuestImport";
import { GuestManager } from "@/components/f1/GuestManager";
import { PinLogin } from "@/components/f1/PinLogin";
import { Rundown } from "@/components/f1/Rundown";
import {
  DeclinedScreen,
  InvalidLinkScreen,
  InvitationScreen,
  TicketScreen,
} from "@/components/f1/tamu";
import { TicketQr } from "@/components/TicketQr";
import { computeStats } from "@/lib/data/store";
import {
  DEMO_NOW,
  DEMO_NOW_H1,
  demoEvent,
  demoEventWithCsv,
  demoGuestView,
  demoOtherEvent,
  demoSessions,
} from "@/lib/fixtures";
import { addDays, dateMedium } from "@/lib/format";
import { googleCalendarUrl } from "@/lib/ics";
import { sessionForGuest } from "@/lib/sessionForm";
import { toEventCard } from "@/lib/view";

// Registri layar F1 (F1-deliverables.md v5 "Daftar layar", 37 layar, urutan sama) untuk
// /dev/states/f1/[code]. Semua pakai komponen layar yang sama dengan route asli, data contoh, tanpa
// aksi ke server.

export type ScreenDef = {
  code: string;
  name: string;
  lane: "Tamu" | "Panitia";
  kind: "Utama" | "Gagal" | "Kasus lain" | "Aksi";
  render: () => ReactNode | Promise<ReactNode>;
};

const csv = (f: string) => readFileSync(join(process.cwd(), "public", "dev", f), "utf8");
const now = new Date(DEMO_NOW);
const rara = {
  name: "Rara Wening",
  ig: "@rarawening",
  wa: "0812 3456 7890",
  job: "",
  interests: "",
  follow: true,
};
const qr = () => <TicketQr payload="demo-ticket.0000000000000000" label="QR tiket contoh" />;
// (6 Nov) Alamat Info rumah contoh → "Di mana" T01 & "Lokasi" tiket jadi link Google Maps.
const withAddress = {
  ...demoEvent,
  houseInfo: { wifiName: null, wifiPassword: null, address: "Jl. Kemang Raya No. 8, Jakarta" },
};
const ticket = (variant: "t03" | "t03h", calendarOpen = false) => (
  <TicketScreen
    variant={variant}
    guestName="Rara Wening"
    event={withAddress}
    keyNo="#014"
    code="HMD-014-7F3K"
    qr={qr()}
    calendar={{
      event: demoEvent,
      googleHref: googleCalendarUrl(demoEvent, "https://hmd.example/t/demo"),
      icsHref: "#",
      initialOpen: calendarOpen,
    }}
    now={variant === "t03h" ? DEMO_NOW_H1 : DEMO_NOW}
    frozen
  />
);
const cards = [
  toEventCard(demoEvent, { guests: 20, sessions: 4 }, now),
  toEventCard(demoOtherEvent, { guests: 0, sessions: 0 }, now),
];
const reminderDate = dateMedium(addDays(demoEvent.date, -1));
const manager = (
  props: Partial<Parameters<typeof GuestManager>[0]> = {},
  view = demoGuestView(),
) => (
  <GuestManager
    eventId={demoEvent.id}
    reminderDateLabel={reminderDate}
    templateFromCsv
    dmTemplate={demoEvent.dmTemplate}
    guests={view.rows}
    stats={view.stats}
    {...props}
  />
);

// PE03b dan sheet di atasnya (PE03e / PE03h).
const filledHome = (initialSheet?: "edit" | "delete" | "start", startedAt?: string) => {
  const v = demoGuestView((gs) => {
    gs[0].inviteStatus = "diundang"; // 13 diundang seperti Figma PE03b
  });
  return (
    <EventHome
      event={startedAt ? { ...demoEventWithCsv, startedAt } : demoEventWithCsv}
      stats={v.stats}
      sessions={demoSessions}
      now={DEMO_NOW}
      initialSheet={initialSheet}
    />
  );
};

const invitation = () => (
  <InvitationScreen
    keyNo="#014"
    event={withAddress}
    sessions={demoSessions.map(sessionForGuest)}
    confirmHref="/dev/states/f1/T02"
  />
);

export const SCREENS: ScreenDef[] = [
  {
    code: "T01a",
    name: "Amplop tertutup · tap segel / Buka undangan",
    lane: "Tamu",
    kind: "Utama",
    render: () => (
      <InviteGate token="demo" guestName="Rara Wening" preview>
        {invitation()}
      </InviteGate>
    ),
  },
  {
    code: "T01",
    name: "Undangan · kartu kertas, Jejak undangan",
    lane: "Tamu",
    kind: "Utama",
    render: invitation,
  },
  {
    code: "T01e",
    name: "Link tidak valid / kedaluwarsa",
    lane: "Tamu",
    kind: "Gagal",
    render: () => <InvalidLinkScreen retryHref="#" />,
  },
  {
    code: "T02",
    name: "Konfirmasi hadir (WA, pekerjaan & minat opsional)",
    lane: "Tamu",
    kind: "Utama",
    render: () => <ConfirmForm backHref="/dev/states/f1/T01" doneHref="#" initial={rara} />,
  },
  {
    code: "T02b",
    name: "Nggak bisa datang + titip ucapan",
    lane: "Tamu",
    kind: "Kasus lain",
    render: () => (
      <DeclinedScreen
        guestName="Rara Wening"
        event={demoEvent}
        changeHref="#"
        farewell={{ initial: "Selamat pindahan! Semoga makin seru di kantor baru", sent: false }}
      />
    ),
  },
  {
    code: "T02c",
    name: "Form belum lengkap",
    lane: "Tamu",
    kind: "Gagal",
    render: () => (
      <ConfirmForm
        backHref="#"
        doneHref="#"
        initial={{ ...rara, ig: "", wa: "", follow: false }}
        initialStatus="incomplete"
      />
    ),
  },
  {
    code: "T02d",
    name: "Gagal kirim (sinyal)",
    lane: "Tamu",
    kind: "Gagal",
    render: () => <ConfirmForm backHref="#" doneHref="#" initial={rara} initialStatus="error" />,
  },
  {
    code: "T03",
    name: "Tiket + countdown",
    lane: "Tamu",
    kind: "Utama",
    render: () => ticket("t03"),
  },
  {
    code: "T03k",
    name: "Simpan ke kalender (sheet)",
    lane: "Tamu",
    kind: "Kasus lain",
    render: () => ticket("t03", true),
  },
  {
    code: "T03h",
    name: "Dibuka dari WA H-1, countdown jam",
    lane: "Tamu",
    kind: "Kasus lain",
    render: () => ticket("t03h"),
  },
  {
    code: "P01",
    name: "Masuk panitia (PIN)",
    lane: "Panitia",
    kind: "Utama",
    render: () => <PinLogin initialPin="123" />,
  },
  {
    code: "P01b",
    name: "PIN salah",
    lane: "Panitia",
    kind: "Gagal",
    render: () => <PinLogin initialPin="123456" initialState={{ kind: "wrong", remaining: 2 }} />,
  },
  {
    code: "P01c",
    name: "Terkunci 5 menit",
    lane: "Panitia",
    kind: "Gagal",
    render: () => <PinLogin initialState={{ kind: "locked", ms: (4 * 60 + 52) * 1000 }} />,
  },
  {
    code: "PE01",
    name: "Daftar event",
    lane: "Panitia",
    kind: "Utama",
    render: () => <EventList events={cards} />,
  },
  {
    code: "PE01s",
    name: "Hapus event (geser kiri)",
    lane: "Panitia",
    kind: "Aksi",
    render: () => <EventList events={cards} initialSwiped={cards[0]?.id} />,
  },
  {
    code: "PE01a",
    name: "Belum ada event",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => <EventList events={[]} />,
  },
  {
    code: "PE02",
    name: "Buat event (nama + tanggal)",
    lane: "Panitia",
    kind: "Utama",
    render: () => (
      <EventList
        events={cards}
        initialSheet
        initialDraft={{ name: "House Moving Day", date: "2026-11-08" }}
      />
    ),
  },
  {
    code: "PE03",
    name: "Home event, masih kosong",
    lane: "Panitia",
    kind: "Utama",
    render: () => (
      <EventHome event={demoEvent} stats={computeStats([])} sessions={[]} now={DEMO_NOW} />
    ),
  },
  {
    code: "PE03b",
    name: "Home event, udah terisi",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => filledHome(),
  },
  {
    code: "PE03m",
    name: "Mulai event? (dialog)",
    lane: "Panitia",
    kind: "Aksi",
    render: () => filledHome("start"),
  },
  {
    code: "PE03s",
    name: "Event udah dimulai (detail dikunci)",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => filledHome(undefined, "2026-11-08T05:55:00Z"),
  },
  {
    code: "PE03e",
    name: "Ubah detail event (sheet)",
    lane: "Panitia",
    kind: "Aksi",
    render: () => filledHome("edit"),
  },
  {
    code: "PE03h",
    name: "Hapus event · konfirmasi",
    lane: "Panitia",
    kind: "Aksi",
    render: () => filledHome("delete"),
  },
  {
    code: "PE04k",
    name: "Rundown, belum ada sesi",
    lane: "Panitia",
    kind: "Aksi",
    render: () => <Rundown eventId={demoEvent.id} eventName={demoEvent.name} sessions={[]} />,
  },
  {
    code: "PE04",
    name: "Rundown, atur sesi",
    lane: "Panitia",
    kind: "Aksi",
    render: () => (
      <Rundown eventId={demoEvent.id} eventName={demoEvent.name} sessions={demoSessions} />
    ),
  },
  {
    code: "PE04a",
    name: "Ubah sesi · Talkshow (🗑 di judul)",
    lane: "Panitia",
    kind: "Aksi",
    render: () => (
      <Rundown
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        sessions={demoSessions}
        initialEditing="s02"
      />
    ),
  },
  {
    code: "PE04b",
    name: "Ubah sesi · Info",
    lane: "Panitia",
    kind: "Aksi",
    render: () => (
      <Rundown
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        sessions={demoSessions}
        initialEditing="s03"
      />
    ),
  },
  {
    code: "PE04s",
    name: "Swipe kiri hapus sesi",
    lane: "Panitia",
    kind: "Aksi",
    render: () => (
      <Rundown
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        sessions={demoSessions}
        initialSwiped="s03"
      />
    ),
  },
  {
    code: "P04k",
    name: "Tamu & undangan, belum ada tamu",
    lane: "Panitia",
    kind: "Utama",
    render: () => <GuestImport eventId={demoEvent.id} eventName={demoEvent.name} />,
  },
  {
    code: "P04a",
    name: "Cek & simpan CSV (sekali)",
    lane: "Panitia",
    kind: "Utama",
    render: () => (
      <GuestImport
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        initialFile={{ name: "tamu-hmd-dummy.csv", text: csv("tamu-hmd-dummy.csv") }}
      />
    ),
  },
  {
    code: "P04c",
    name: "CSV ada baris error",
    lane: "Panitia",
    kind: "Gagal",
    render: () => (
      <GuestImport
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        initialFile={{ name: "tamu-hmd-error.csv", text: csv("tamu-hmd-error.csv") }}
      />
    ),
  },
  {
    code: "P04i",
    name: "IG kosong / salah format",
    lane: "Panitia",
    kind: "Gagal",
    render: () => (
      <GuestImport
        eventId={demoEvent.id}
        eventName={demoEvent.name}
        initialFile={{ name: "tamu-hmd-dummy.csv", text: csv("tamu-hmd-ig.csv") }}
      />
    ),
  },
  {
    code: "P04",
    name: "Tamu & undangan, undang via DM IG",
    lane: "Panitia",
    kind: "Utama",
    render: () => manager(),
  },
  {
    code: "P04d",
    name: "Balik dari IG (toast)",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => {
      const v = demoGuestView((gs) => {
        gs[0].inviteStatus = "diundang";
        gs[0].invitedAt = DEMO_NOW;
      });
      return manager(
        {
          initialToast: {
            guestId: "g001",
            ig: "yogasap",
            prev: { inviteStatus: "belum", invitedAt: null },
          },
        },
        v,
      );
    },
  },
  {
    code: "P04g",
    name: "Filter · Belum jawab (↻ undang lagi)",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => manager({ initialFilter: "belumJawab" }),
  },
  {
    code: "P04h",
    name: "Filter · Belum diundang (✈)",
    lane: "Panitia",
    kind: "Kasus lain",
    render: () => manager({ initialFilter: "belum" }),
  },
  {
    code: "P04f",
    name: "Tambah tamu manual",
    lane: "Panitia",
    kind: "Aksi",
    render: () => manager({ initialSheet: { kind: "add" } }),
  },
  {
    code: "P04e",
    name: "Ubah tamu (🗑 di judul)",
    lane: "Panitia",
    kind: "Aksi",
    render: () => manager({ initialSheet: { kind: "edit", id: "g003" } }),
  },
  {
    code: "P04s",
    name: "Swipe kiri hapus tamu",
    lane: "Panitia",
    kind: "Aksi",
    render: () => manager({ initialSwiped: "g002" }),
  },
  {
    code: "P04b",
    name: "Pengingat H-1 · Kirim WA / DM IG per tamu",
    lane: "Panitia",
    kind: "Utama",
    render: () =>
      manager(
        { initialTab: "pengingat" },
        demoGuestView((gs) => {
          gs[2].reminderSentAt = DEMO_NOW;
          gs[5].reminderSentAt = DEMO_NOW;
          const noWa = gs.find((g, i) => i > 5 && g.rsvp === "hadir");
          if (noWa) noWa.wa = null; // tamu nggak isi WA → tombol DM IG
        }),
      ),
  },
];
