import type { ReactNode } from "react";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { KolaseScreen } from "@/components/f5/KolaseKulkas";
import { RekapScreen } from "@/components/f5/Rekap";
import { SelesaiLuarScreen, SelesaiScreen } from "@/components/f5/Selesai";
import { sessionShort } from "@/lib/data/sessionInfo";
import type { FeedbackRecap, Session } from "@/lib/data/types";
import type { SummaryView } from "@/lib/feedback";
import { demoEvent, demoSessions, NAMES } from "@/lib/fixtures";
import { rundownView } from "@/lib/rundown";
import { firstName, fromMinutes, toMinutes } from "@/lib/format";
import { igProfileUrl, POTARA_IG } from "@/lib/invite";
import { photoTone, type KolasePhoto } from "@/lib/kolase";
import { polaroidDate } from "@/lib/photo";

// Registri layar F5 tamu (F5-deliverables.md "Daftar layar", Figma 4671:4888) untuk
// /dev/states/f5/[code]. Komponen sama dengan route asli, data contoh (48 foto placeholder,
// nama dari fixtures), tanpa server: kirim/hapus/simpan foto cuma toast.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Gagal" | "Kasus lain";
  lane: "Tamu" | "Panitia";
  render: () => ReactNode;
};

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const sessions = demoSessions.map((s) => ({ id: s.id, title: sessionShort(s) })); // label pendek (K4)
const HEIGHTS = [1280, 960, 1280, 1100, 800, 1280]; // rasio bervariasi seperti contoh Figma

// 48 foto dari 20 tamu, terbaru dulu; tamu ke-0 = Rara (pemilik HP, "Foto saya").
const PHOTOS: KolasePhoto[] = Array.from({ length: 48 }, (_, i) => {
  const [name] = NAMES[i % 20];
  const session = sessions[[1, 0, 2, 1, 3, 0, 2][i % 7]];
  return {
    id: id(i + 1),
    mine: i % 20 === 0,
    name,
    first: firstName(name),
    sessionId: session.id,
    session: session.title,
    time: `${14 + (i % 3)}.${String((i * 7) % 60).padStart(2, "0")}`,
    width: 1067,
    height: HEIGHTS[i % HEIGHTS.length],
    tone: photoTone(id(i + 1)),
  };
});

const back = "/dev/states/f5";
const kolase = (photos: KolasePhoto[], preview: Parameters<typeof KolaseScreen>[0]["preview"]) => (
  <KolaseScreen
    token={null}
    greeting={`Terima kasih sudah mampir, ${firstName(NAMES[0][0])}`}
    dateLabel="8 Nov 2026"
    shortDate={polaroidDate(demoEvent.date)}
    photos={photos}
    photoGuests={photos.length ? 20 : 0}
    sessions={sessions}
    backHref={back}
    followHref={igProfileUrl(POTARA_IG)}
    preview={preview}
  />
);

// BT12 v2: semua sesi jadi sobekan + tiket "SATU LAGI"; `preview` = sheet T14/T14b/T14c kebuka.
const selesai = (
  opts: { filled?: boolean; preview?: Parameters<typeof SelesaiScreen>[0]["preview"] } = {},
) => (
  <SelesaiScreen
    token={null}
    photoCount={48}
    questionCount={23}
    guestCount={20}
    tickets={demoSessions.map((x, i) => ({
      id: x.id,
      no: i + 1,
      title: x.title,
      startsAt: x.startsAt,
      endsAt: fromMinutes(toMinutes(x.startsAt) + x.durationMin),
      room: x.room ?? null,
      state: "done" as const,
    }))}
    ticketCaption="4 dari 4 selesai"
    latest={PHOTOS.slice(0, 4).map((p) => ({ id: p.id, tone: p.tone }))}
    filled={!!opts.filled}
    sessions={sessions}
    kolaseHref={back}
    initialSheet={!!opts.preview}
    preview={opts.preview}
  />
);

const FILLED = { rating: 4, highlight: "s02", improve: "", invite: "mau" as const };

// ---- Panitia: BP04 = BP02 dengan semua sesi selesai; P11 = contoh Figma (15 dari 18) ----
const DONE_SESSIONS: Session[] = demoSessions.map((x, i) => ({
  ...x,
  status: "selesai",
  startedAt: `2026-11-08T${["13:00", "14:00", "14:45", "15:30"][i]}:00+07:00`,
  endedAt: `2026-11-08T${["13:58", "14:44", "15:28", "16:58"][i]}:00+07:00`,
}));

const kontrol = (opts: { sheet?: boolean; closed?: boolean }) => (
  <KontrolScreen
    event={demoEvent}
    rundown={rundownView({ ...demoEvent, mode: "jeda", nextSessionId: null }, DONE_SESSIONS)}
    checkIn={{ checkedIn: 20, expected: 20 }}
    photos={48}
    eventDay
    phaseLabel="Hari-H · Live"
    backHref={back}
    serverNow="2026-11-08T17:00:00+07:00"
    frozen
    finale={{
      canClose: true,
      closedAt: opts.closed ? "2026-11-08T17:02:00+07:00" : null,
      lastEndedAt: DONE_SESSIONS.at(-1)!.endedAt!,
      feedback: { respondents: 15, expected: 18 },
    }}
    initialCloseSheet={opts.sheet}
  />
);

const RECAP: FeedbackRecap = {
  respondents: 15,
  expected: 18,
  avgRating: 4.6,
  inviteAgainPct: 87,
  highlights: [7, 4, 3, 1].map((count, i) => ({
    sessionId: sessions[[1, 0, 2, 3][i]].id,
    title: sessions[[1, 0, 2, 3][i]].title,
    count,
  })),
  improvements: [
    "Check-in cepet banget, tapi info parkir kurang jelas.",
    "Talkshow-nya kependekan, pengen sesi tanya jawab lebih lama.",
    "AC di ruang depan kurang dingin pas rame.",
    "Snack-nya cepet abis.",
  ].map((text, i) => ({ no: [4, 7, 9, 12][i], text, at: "2026-11-08T17:20:00+07:00" })),
  summary: null,
  purgedAt: null,
};

const POINTS = [
  "Tamu paling suka talkshow yang santai dan interaktif.",
  "Check-in dinilai cepat; beberapa minta info parkir.",
  "Ide berulang: tur kantor lebih panjang.",
];

const rekap = (recap: FeedbackRecap, summary: SummaryView) => (
  <RekapScreen
    eventId={null}
    backHref={back}
    recap={recap}
    summary={summary}
    purgeDate="8 Des 2026"
    csvHref={back}
  />
);

export const SCREENS: ScreenDef[] = [
  {
    code: "BT12",
    name: "Acara selesai",
    kind: "Utama",
    lane: "Tamu",
    render: () => selesai(),
  },
  {
    code: "BT12-isi",
    name: "Acara selesai · buku tamu udah diisi (TODO desain)",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => selesai({ filled: true }),
  },
  {
    code: "BT12-luar",
    name: "Acara selesai · belum check-in",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => <SelesaiLuarScreen followHref={igProfileUrl(POTARA_IG)} />,
  },
  {
    code: "T14",
    name: "Buku tamu",
    kind: "Utama",
    lane: "Tamu",
    render: () => selesai({ preview: { draft: FILLED } }),
  },
  {
    code: "T14b",
    name: "Buku tamu gagal kirim",
    kind: "Gagal",
    lane: "Tamu",
    render: () =>
      selesai({
        preview: { draft: { ...FILLED, improve: "Parkir motornya agak sempit." }, failed: true },
      }),
  },
  {
    code: "T14c",
    name: "Rating belum diisi",
    kind: "Gagal",
    lane: "Tamu",
    render: () => selesai({ preview: { draft: { ...FILLED, rating: 0 }, hint: true } }),
  },
  {
    code: "T14d",
    name: "Udah pernah isi",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => kolase(PHOTOS, { filledToast: true }),
  },
  {
    code: "T15",
    name: "Kolase kulkas",
    kind: "Utama",
    lane: "Tamu",
    render: () => kolase(PHOTOS, {}),
  },
  {
    code: "T15b",
    name: "Detail foto",
    kind: "Utama",
    lane: "Tamu",
    render: () => kolase(PHOTOS, { openId: PHOTOS[0].id }),
  },
  {
    code: "T15c",
    name: "Simpan kolase (9:16)",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => kolase(PHOTOS, { sheet: true }),
  },
  {
    code: "T15d",
    name: "Kolase kosong",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => kolase([], {}),
  },
  {
    code: "BP04",
    name: "Semua sesi selesai",
    kind: "Utama",
    lane: "Panitia",
    render: () => kontrol({}),
  },
  {
    code: "BP04b",
    name: "Konfirmasi tutup acara",
    kind: "Kasus lain",
    lane: "Panitia",
    render: () => kontrol({ sheet: true }),
  },
  {
    code: "BP04-tutup",
    name: "Setelah acara ditutup (belum ada di Figma)",
    kind: "Kasus lain",
    lane: "Panitia",
    render: () => kontrol({ closed: true }),
  },
  {
    code: "P11",
    name: "Rekap buku tamu",
    kind: "Utama",
    lane: "Panitia",
    render: () => rekap(RECAP, { kind: "ready", points: POINTS }),
  },
  {
    code: "P11b",
    name: "Claude gagal ngeringkas",
    kind: "Gagal",
    lane: "Panitia",
    render: () => rekap(RECAP, { kind: "failed" }),
  },
  {
    code: "P11c",
    name: "Belum ada feedback",
    kind: "Kasus lain",
    lane: "Panitia",
    render: () =>
      rekap(
        { ...RECAP, respondents: 0, avgRating: null, inviteAgainPct: null, improvements: [] },
        { kind: "waiting" },
      ),
  },
  {
    code: "P11d",
    name: "Data terhapus otomatis",
    kind: "Kasus lain",
    lane: "Panitia",
    render: () =>
      rekap(
        { ...RECAP, improvements: [], purgedAt: "2026-12-08T00:00:00+07:00" },
        { kind: "ready", points: POINTS },
      ),
  },
];

// T15e = share sheet bawaan HP (navigator.share), bukan layar kita: uji dari T15 / T15c di HP.
