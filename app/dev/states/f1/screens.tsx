import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { ConfirmForm } from "@/components/f1/ConfirmForm";
import { EventHome } from "@/components/f1/EventHome";
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
import { toEventCard } from "@/lib/view";

// Registri layar F1 (F1-deliverables.md "Daftar layar" + "Update layar 22 Okt sore") untuk /dev/states/f1/[code].
// Semua pakai komponen layar yang sama dengan route asli, dengan data contoh & tanpa aksi.

export type ScreenDef = {
  code: string;
  name: string;
  lane: "Tamu" | "Panitia";
  kind: "Utama" | "Gagal" | "Kasus lain" | "Aksi";
  render: () => ReactNode | Promise<ReactNode>;
};

const csv = (f: string) => readFileSync(join(process.cwd(), "public", "dev", f), "utf8");
const now = new Date(DEMO_NOW);
const rara = { name: "Rara Wening", ig: "@rarawening", wa: "0812 3456 7890", follow: true };
const qr = () => <TicketQr payload="demo-ticket.0000000000000000" label="QR tiket contoh" />;
const ticket = (variant: "t03" | "t03h") => (
  <TicketScreen
    variant={variant}
    guestName="Rara Wening"
    event={demoEvent}
    keyNo="#014"
    code="HMD-014-7F3K"
    qr={qr()}
    calendarHref="#"
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
const filledHome = (initialSheet?: "edit" | "delete") => {
  const v = demoGuestView((gs) => {
    gs[0].inviteStatus = "diundang"; // 13 diundang seperti Figma PE03b
  });
  return (
    <EventHome
      event={demoEventWithCsv}
      stats={v.stats}
      sessions={demoSessions}
      now={DEMO_NOW}
      initialSheet={initialSheet}
    />
  );
};

export const SCREENS: ScreenDef[] = [
  {
    code: "T01",
    name: "Undangan",
    lane: "Tamu",
    kind: "Utama",
    render: () => (
      <InvitationScreen
        guestName="Rara Wening"
        event={demoEvent}
        sessions={demoSessions}
        confirmHref="/dev/states/f1/T02"
      />
    ),
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
    name: "Konfirmasi hadir (nomor WA wajib)",
    lane: "Tamu",
    kind: "Utama",
    render: () => <ConfirmForm backHref="/dev/states/f1/T01" doneHref="#" initial={rara} />,
  },
  {
    code: "T02b",
    name: "Nggak bisa datang (thank you)",
    lane: "Tamu",
    kind: "Kasus lain",
    render: () => <DeclinedScreen guestName="Rara Wening" event={demoEvent} changeHref="#" />,
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
        initial={{ name: "Rara Wening", ig: "", wa: "", follow: false }}
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
    name: "Event kamu",
    lane: "Panitia",
    kind: "Utama",
    render: () => <EventList events={cards} />,
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
    name: "Ubah / hapus sesi",
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
          initialJustInvited: "g001",
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
    code: "P04f",
    name: "Tambah tamu manual",
    lane: "Panitia",
    kind: "Aksi",
    render: () => manager({ initialSheet: { kind: "add" } }),
  },
  {
    code: "P04e",
    name: "Ubah / hapus tamu",
    lane: "Panitia",
    kind: "Aksi",
    render: () => manager({ initialSheet: { kind: "edit", id: "g003" } }),
  },
  {
    code: "P04b",
    name: "Kirim pengingat H-1 via WA",
    lane: "Panitia",
    kind: "Utama",
    render: () =>
      manager(
        { initialTab: "pengingat" },
        demoGuestView((gs) => {
          gs[2].reminderSentAt = DEMO_NOW;
          gs[5].reminderSentAt = DEMO_NOW;
        }),
      ),
  },
];
