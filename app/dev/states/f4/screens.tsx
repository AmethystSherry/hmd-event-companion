import type { ComponentProps, ReactNode } from "react";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { FotoMasukScreen } from "@/components/f3/FotoMasuk";
import { AcaraScreen } from "@/components/f4/AcaraScreen";
import { acaraView } from "@/lib/acara";
import { HMD_ID, seedData } from "@/lib/data/seed";
import { createStore, type DataStore } from "@/lib/data/store";
import { demoEvent, demoSessions, NAMES } from "@/lib/fixtures";
import { firstName } from "@/lib/format";
import { photoTone, type KolasePhoto } from "@/lib/kolase";
import { toGuestPhotos, type GuestPhotos } from "@/lib/photo";
import { rundownView } from "@/lib/rundown";
import type { GuestCard } from "@/lib/data/types";
import { demoCard } from "../n3/cards";

// Registri layar F3 + F4 (F3-F4-deliverables.md "Daftar layar", Figma C18 4899:12734) untuk
// /dev/states/f4/[code]. Komponen sama dengan route asli, data contoh dari store di memori
// (20 tamu, 18 udah masuk, kartu BT05 dummy), tanpa server: jam beku, tanpa LiveRefresh.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Kasus" | "Aksi" | "Gagal";
  lane: "Tamu" | "Panitia";
  render: () => ReactNode;
};

const at = (hhmm: string) => `2026-11-08T${hhmm}+07:00`;
const back = "/dev/states/f4";

// Store contoh: 20 tamu hadir (Rara = pemilik HP, #014 seperti Figma), 18 udah masuk.
// /dev/states/n3: `here` (siapa yang udah masuk) & `card` (kartu per tamu, null = kosong) bisa diganti.
export type DemoOpts = {
  here?: (name: string, i: number) => boolean;
  card?: (name: string, i: number) => GuestCard | null;
};
export function demoStore(steps: (s: DataStore) => void, opts: DemoOpts = {}): DataStore {
  const here = opts.here ?? ((_: string, i: number) => i < 18);
  const card = opts.card ?? demoCard;
  const store = createStore(seedData(new Date(at("09:00:00"))), {
    now: () => new Date(at("09:00:00")),
  });
  NAMES.slice(0, 20).forEach(([name, ig], i) => {
    const g = store.addGuest(HMD_ID, { name, ig, wa: null });
    store.setRsvp(g.id, {
      rsvp: "hadir",
      name,
      ig,
      wa: "6281234567890",
      followConfirmed: true,
    });
    store.setGuestCard(g.id, card(name, i));
    if (here(name, i)) {
      const t = `12:${String(40 + i).padStart(2, "0")}:00`;
      store.checkIn(
        HMD_ID,
        { guestId: g.id },
        { opId: `op${i}`, method: "scan", by: "HP A", at: at(t) },
      );
    }
  });
  steps(store);
  return store;
}

const s = (store: DataStore, id: "s01" | "s02" | "s03" | "s04", from: string, to?: string) => {
  store.startSession(HMD_ID, id, at(from));
  if (to) store.finishSession(HMD_ID, id, at(to));
};

// Dipakai juga /dev/states/n4 (BT03 + sheet foto/galeri N4, `photos` diganti data contoh).
export function acara(
  steps: (s: DataStore) => void,
  now: string,
  preview: ComponentProps<typeof AcaraScreen>["preview"] = {},
  photos?: GuestPhotos,
  opts?: DemoOpts,
) {
  const store = demoStore(steps, opts);
  const me = store.listGuests(HMD_ID).find((g) => g.ig === "rarawening")!;
  const view = acaraView({
    event: store.getEvent(HMD_ID)!,
    sessions: store.listSessions(HMD_ID),
    guests: store.listGuests(HMD_ID),
    tickets: store.listTickets(HMD_ID),
    me: { ...me, keyNo: 14 },
    now: new Date(at(now)),
    rev: store.rev,
  });
  return (
    <AcaraScreen
      token="demo-token"
      view={view}
      photos={
        photos ??
        toGuestPhotos({
          name: "Rara",
          endsAt: store.getEvent(HMD_ID)!.endsAt,
          guestId: me.id,
          photos: store.listPhotos(HMD_ID),
        })
      }
      serverNow={at(now)}
      preview={{ sheet: undefined, ...preview, offline: preview?.offline ?? false }}
    />
  );
}

const openSpace = (st: DataStore) => s(st, "s01", "13:00:00");
export const jeda1 = (st: DataStore) => s(st, "s01", "13:00:00", "13:58:00");
export const talkshow = (st: DataStore) => {
  jeda1(st);
  s(st, "s02", "14:00:00");
};

// Dipakai juga /dev/states/n1 (BP02 dengan tile Pertanyaan).
export function kontrol(
  steps: (s: DataStore) => void,
  now: string,
  opts: {
    confirm?: "finish" | "start";
    conflict?: string;
    questions?: { total: number; open: number };
  } = {},
) {
  const store = demoStore(steps);
  const event = store.getEvent(HMD_ID)!;
  const rundown = rundownView(event, store.listSessions(HMD_ID));
  return (
    <KontrolScreen
      event={demoEvent}
      rundown={rundown}
      checkIn={store.doorStats(HMD_ID)}
      questions={opts.questions}
      eventDay
      phaseLabel="Hari-H · Live"
      backHref={back}
      serverNow={at(now)}
      frozen
      initialConfirm={
        opts.confirm === "finish" && rundown.active
          ? { kind: "finish", session: rundown.active }
          : opts.confirm === "start" && rundown.next
            ? { kind: "start", session: rundown.next }
            : undefined
      }
      initialConflict={opts.conflict}
    />
  );
}

// P13 · 34 foto contoh dari 20 tamu (placeholder gradasi, rasio bervariasi), terbaru dulu.
const P13_SESSIONS = demoSessions.map((x) => ({ id: x.id, title: x.title }));
const P13_HEIGHTS = [1280, 960, 1280, 1100, 800, 1280];
const P13_PHOTOS: KolasePhoto[] = Array.from({ length: 34 }, (_, i) => {
  const id = `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
  const [name] = NAMES[i % 20];
  const session = P13_SESSIONS[[1, 0, 2, 1, 3, 0, 2][i % 7]];
  return {
    id,
    mine: false,
    name,
    first: firstName(name),
    sessionId: session.id,
    session: session.title,
    time: "14.10",
    width: 1067,
    height: P13_HEIGHTS[i % P13_HEIGHTS.length],
    tone: photoTone(id),
  };
});
const fotoMasuk = (photos: KolasePhoto[], confirmId?: string) => (
  <FotoMasukScreen
    eventId={demoEvent.id}
    phaseLabel="Hari-H"
    photos={photos}
    sessions={P13_SESSIONS}
    preview={{ confirmId }}
  />
);

export const SCREENS: ScreenDef[] = [
  {
    code: "BT20",
    name: "Sesi · Open space",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(openSpace, "13:12:00"),
  },
  {
    code: "BT21",
    name: "Sesi · Talkshow",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(talkshow, "14:10:00"),
  },
  {
    code: "BT23",
    name: "Sesi · Tur kantor",
    kind: "Utama",
    lane: "Tamu",
    render: () =>
      acara((st) => {
        talkshow(st);
        s(st, "s03", "14:45:00");
      }, "14:55:00"),
  },
  {
    code: "BT24",
    name: "Sesi · Closing & networking",
    kind: "Utama",
    lane: "Tamu",
    render: () =>
      acara((st) => {
        talkshow(st);
        s(st, "s03", "14:45:00", "15:28:00");
        s(st, "s04", "15:30:00");
      }, "15:40:00"),
  },
  {
    code: "BT03",
    name: "Jeda · tiket berikutnya",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(jeda1, "13:48:00"),
  },
  {
    code: "BT03s",
    name: "Sebentar lagi mulai (jam mulai lewat)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, "14:01:00"),
  },
  {
    code: "BT03-awal",
    name: "Jeda · sebelum sesi 1 (12.50)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(() => {}, "12:50:00"),
  },
  {
    code: "BT03-akhir",
    name: "Jeda terakhir · semua sesi selesai",
    kind: "Kasus",
    lane: "Tamu",
    render: () =>
      acara((st) => {
        talkshow(st);
        s(st, "s03", "14:45:00", "15:28:00");
        s(st, "s04", "15:30:00", "16:58:00");
      }, "17:00:00"),
  },
  {
    code: "BT22",
    name: "Detail sesi (sheet)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(openSpace, "13:12:00", { sheet: "detail", sessionId: "s01" }),
  },
  {
    code: "BT21p",
    name: "Profil pembicara (sheet)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(talkshow, "14:10:00", { sheet: "pembicara" }),
  },
  {
    code: "BT-rumah",
    name: "Info rumah (sheet, Wi-Fi + alamat)",
    kind: "Kasus",
    lane: "Tamu",
    render: () =>
      acara(
        (st) => {
          jeda1(st);
          st.setHouseInfo(HMD_ID, {
            wifiName: "Potara Guest",
            wifiPassword: "rumahbaru2026",
            address: "Jl. Contoh No. 8, Bandung",
          });
        },
        "13:48:00",
        { sheet: "rumah" },
      ),
  },
  {
    code: "BT-rumah-kosong",
    name: "Info rumah belum diisi panitia",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, "13:48:00", { sheet: "rumah" }),
  },
  {
    code: "BT04",
    name: "Rundown (sheet)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, "13:48:00", { sheet: "rundown" }),
  },
  {
    code: "BT05",
    name: "Tamu di sini (sheet, N3)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, "13:48:00", { sheet: "tamu" }),
  },
  {
    code: "S01",
    name: "Jeda · sinyal lemah (toast)",
    kind: "Gagal",
    lane: "Tamu",
    render: () => acara(jeda1, "13:58:00", { offline: true }),
  },
  {
    code: "BP02",
    name: "Kontrol acara · sesi berjalan",
    kind: "Utama",
    lane: "Panitia",
    render: () => kontrol(openSpace, "13:12:34"),
  },
  {
    code: "BP03",
    name: "Konfirmasi selesaikan sesi",
    kind: "Aksi",
    lane: "Panitia",
    render: () => kontrol(openSpace, "13:58:00", { confirm: "finish" }),
  },
  {
    code: "BP01",
    name: "Kontrol acara · jeda",
    kind: "Utama",
    lane: "Panitia",
    render: () => kontrol(jeda1, "13:58:30"),
  },
  {
    code: "BP01b",
    name: "Konfirmasi mulai sesi",
    kind: "Aksi",
    lane: "Panitia",
    render: () => kontrol(jeda1, "13:59:00", { confirm: "start" }),
  },
  {
    code: "BP01-telat",
    name: "Jeda · lewat jam mulai berikutnya",
    kind: "Kasus",
    lane: "Panitia",
    render: () => kontrol(jeda1, "14:03:00"),
  },
  {
    code: "BP02c",
    name: "Waktu sesi lewat",
    kind: "Kasus",
    lane: "Panitia",
    render: () => kontrol(openSpace, "14:02:10"),
  },
  {
    code: "BP02d",
    name: "Diubah panitia lain (toast)",
    kind: "Kasus",
    lane: "Panitia",
    render: () =>
      kontrol(openSpace, "13:12:34", {
        conflict: "HP 7K2Q udah mulai Open space duluan. Layarmu ikut update.",
      }),
  },
  {
    code: "P13",
    name: "Foto masuk",
    kind: "Kasus",
    lane: "Panitia",
    render: () => fotoMasuk(P13_PHOTOS),
  },
  {
    code: "P13-hapus",
    name: "Foto masuk · konfirmasi hapus",
    kind: "Aksi",
    lane: "Panitia",
    render: () => fotoMasuk(P13_PHOTOS, P13_PHOTOS[0].id),
  },
  {
    code: "P13-kosong",
    name: "Foto masuk · belum ada foto",
    kind: "Kasus",
    lane: "Panitia",
    render: () => fotoMasuk([]),
  },
];
