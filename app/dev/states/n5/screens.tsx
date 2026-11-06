import type { ComponentProps, ReactNode } from "react";
import { AcaraScreen } from "@/components/f4/AcaraScreen";
import type { KenalanPreview, KenalanTab } from "@/components/n5/KenalanQrSheet";
import { PapanKenalanScreen } from "@/components/n5/PapanKenalan";
import { TicketQr } from "@/components/TicketQr";
import { acaraView } from "@/lib/acara";
import { HMD_ID } from "@/lib/data/seed";
import type { DataStore } from "@/lib/data/store";
import { firstName } from "@/lib/format";
import { kenalanBoard, kenalanIntro, kenalanView } from "@/lib/kenalan";
import { toGuestPhotos } from "@/lib/photo";
import { signKenalan } from "@/lib/server/crypto";
import { demoStore, jeda1, kontrol } from "../f4/screens";
import { KENALAN_DUMMY, kenalanDummy } from "./data";

// Registri layar N5 (N5-deliverables.md "Daftar layar", Figma section 5305:9340) untuk
// /dev/states/n5/[code]. Komponen sama dengan route asli (AcaraScreen + sheet), data
// contoh di memori (20 tamu, 18 udah masuk, Rara = pemilik HP #014, papan Dimas 12 · Sekar 7 ·
// Rara 4), tanpa server: jam beku, tanpa kamera & jaringan.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Kasus" | "Aksi" | "Gagal";
  lane: "Tamu" | "Panitia";
  render: () => ReactNode;
};

const at = (hhmm: string) => `2026-11-08T${hhmm}+07:00`;
const NOW = "13:58:00"; // jeda setelah Open space
const ids = Array.from(
  { length: 30 },
  (_, i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
);

type Opts = {
  intros?: boolean; // false = belum ada kenalan (K14)
  winner?: boolean; // pemenang (Dimas) udah diumumin
  me?: string; // ig pemilik HP (default Rara)
  pairs?: [string, string][]; // ganti data papan (default Figma: Dimas 12 · Sekar 7 · Rara 4)
  allHere?: boolean; // 20 tamu udah masuk (Kevin & Maya ikut, buat "0 kenalan")
};

// (6 Nov) P14 cuma 2 tamu ikutan & seri di #1 (Sekar nyusul Dimas di 12, Dimas duluan sampai).
const DUA_TAMU: [string, string][] = [["Dimas", "Sekar"]];
const SERI: [string, string][] = [
  ...KENALAN_DUMMY,
  ...["Hendra", "Putri", "Arif", "Tegar", "Ayu"].map((x) => ["Sekar", x] as [string, string]),
];

function demo({ intros = true, winner = false, me = "rarawening", pairs, allHere = false }: Opts) {
  const store = demoStore(
    (st: DataStore) => {
      jeda1(st);
      if (intros) {
        st.seedIntroductions(kenalanDummy(st, HMD_ID, Date.parse(at("13:50:00")), ids, pairs));
      }
      if (winner) st.announceKenalanWinner(HMD_ID, at("13:55:00"), "HP 7K2Q");
    },
    allHere ? { here: () => true } : {},
  );
  const guest = store.listGuests(HMD_ID).find((g) => g.ig === me)!;
  return { store, guest: { ...guest, keyNo: me === "rarawening" ? 14 : guest.keyNo } };
}

function acara(
  opts: Opts,
  preview: ComponentProps<typeof AcaraScreen>["preview"] = {},
  introOf?: "latest",
) {
  const { store, guest } = demo(opts);
  const view = acaraView({
    event: store.getEvent(HMD_ID)!,
    sessions: store.listSessions(HMD_ID),
    guests: store.listGuests(HMD_ID),
    tickets: store.listTickets(HMD_ID),
    me: guest,
    now: new Date(at(NOW)),
    rev: store.rev,
  });
  const kenalan = kenalanView(store, guest.id);
  const intro =
    introOf && kenalan?.latest ? kenalanIntro(store, guest.id, kenalan.latest.id) : null;
  return (
    <AcaraScreen
      token="demo-token"
      view={view}
      photos={toGuestPhotos({
        name: firstName(guest.name),
        endsAt: store.getEvent(HMD_ID)!.endsAt,
        guestId: guest.id,
        photos: store.listPhotos(HMD_ID),
      })}
      serverNow={at(NOW)}
      kenalan={kenalan}
      kenalanIntro={intro}
      kenalanQr={{
        qr: (
          <TicketQr payload={signKenalan("dev-preview-only", guest.id)} label="QR kenalan kamu" />
        ),
        date: "8.11.26",
      }}
      preview={{
        offline: false,
        ...preview,
        photoId: intro?.id ?? preview.photoId,
      }}
    />
  );
}

// Sheet Kenalan (BTk2 QR saya default / BTk1 Scan QR / BTk3 selfie) di atas layar acara.
function kenalanQr(tab: KenalanTab, kenalanQrPreview: KenalanPreview = {}) {
  return acara({}, { sheet: "kenalan-qr", kenalanQr: { tab, ...kenalanQrPreview } });
}

function papan(opts: Opts, confirm?: boolean) {
  const { store } = demo(opts);
  return (
    <PapanKenalanScreen
      eventId={HMD_ID}
      board={kenalanBoard(store, HMD_ID)}
      phaseLabel="Hari-H · Live"
      initialConfirm={confirm}
    />
  );
}

const dimas = { id: "demo-dimas", name: "Dimas Pratama", firstName: "Dimas" };

export const SCREENS: ScreenDef[] = [
  {
    code: "BT03h",
    name: "Jeda · banner Hadiah",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara({}),
  },
  {
    code: "BT05k",
    name: "Tamu di sini · info hadiah + Kenalan",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara({}, { sheet: "tamu" }),
  },
  {
    code: "BT05k-kosong",
    name: "Belum ada kenalan (K14)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ intros: false }, { sheet: "tamu" }),
  },
  {
    code: "BT05k-1",
    name: "Aku #1 (Dimas) · di puncak",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ me: "dimaspr" }, { sheet: "tamu" }),
  },
  {
    code: "BT05k-2",
    name: "Aku #2 (Sekar) · milestone cuma #1",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ me: "sekarayu" }, { sheet: "tamu" }),
  },
  {
    code: "BT05k-0",
    name: "Aku 0 kenalan, papan udah jalan",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ me: "kevinhrt", allHere: true }, { sheet: "tamu" }),
  },
  {
    code: "BT05k-pemenang",
    name: "Setelah pemenang diumumin (pil hilang)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ winner: true }, { sheet: "tamu" }),
  },
  {
    code: "BTk2",
    name: "Kenalan · tab QR saya (tab pertama)",
    kind: "Utama",
    lane: "Tamu",
    render: () => kenalanQr("qr"),
  },
  {
    code: "BTk1",
    name: "Kenalan · tab Scan QR",
    kind: "Utama",
    lane: "Tamu",
    render: () => kenalanQr("scan"),
  },
  {
    code: "BTk1-tiket",
    name: "Scan QR tiket (K1)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => kenalanQr("scan", { toast: "Ini QR tiket. Minta temanmu buka tab QR saya, ya." }),
  },
  {
    code: "BTk1-sendiri",
    name: "Scan QR sendiri (K5)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => kenalanQr("scan", { toast: "Itu QR kamu sendiri. Scan QR temanmu, ya." }),
  },
  {
    code: "BTk1-kamera",
    name: "Kamera scan ditolak (K8)",
    kind: "Gagal",
    lane: "Tamu",
    render: () => kenalanQr("scan", { scanError: true }),
  },
  {
    code: "BTk3",
    name: "Selfie bukti kenalan",
    kind: "Utama",
    lane: "Tamu",
    render: () => kenalanQr("scan", { step: "selfie", friend: dimas }),
  },
  {
    code: "BTk3-gagal",
    name: "Selfie belum kekirim",
    kind: "Gagal",
    lane: "Tamu",
    render: () => kenalanQr("scan", { step: "gagal", friend: dimas }),
  },
  {
    code: "BTk4",
    name: "Kenalan berhasil",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara({}, { sheet: "kenalan" }, "latest"),
  },
  {
    code: "BTk5",
    name: "Pengumuman pemenang",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara({ winner: true }, { sheet: "pemenang" }),
  },
  {
    code: "BTk5-menang",
    name: "HP pemenang (K11)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara({ winner: true, me: "dimaspr" }, { sheet: "pemenang" }),
  },
  {
    code: "BP02k",
    name: "Kontrol acara · banner Peringkat",
    kind: "Utama",
    lane: "Panitia",
    render: () =>
      kontrol((st) => st.startSession(HMD_ID, "s01", at("13:00:00")), "13:12:34", {
        kenalan: { pairs: 23 },
      }),
  },
  {
    code: "P14",
    name: "Papan kenalan",
    kind: "Utama",
    lane: "Panitia",
    render: () => papan({}),
  },
  {
    code: "P14b",
    name: "Umumkan pemenang (dialog)",
    kind: "Aksi",
    lane: "Panitia",
    render: () => papan({}, true),
  },
  {
    code: "P14-kosong",
    name: "Papan kosong (K12)",
    kind: "Kasus",
    lane: "Panitia",
    render: () => papan({ intros: false }),
  },
  {
    code: "P14-2tamu",
    name: "Cuma 2 tamu ikutan (seri 1–1)",
    kind: "Kasus",
    lane: "Panitia",
    render: () => papan({ pairs: DUA_TAMU }),
  },
  {
    code: "P14-seri",
    name: "Seri di #1 (Dimas & Sekar 12)",
    kind: "Kasus",
    lane: "Panitia",
    render: () => papan({ pairs: SERI }),
  },
  {
    code: "P14-diumumin",
    name: "Setelah diumumin (K12)",
    kind: "Kasus",
    lane: "Panitia",
    render: () => papan({ winner: true }),
  },
];
