import type { ReactNode } from "react";
import { BukuTamuScreen } from "@/components/f5/BukuTamu";
import { KolaseScreen } from "@/components/f5/KolaseKulkas";
import { SelesaiLuarScreen, SelesaiScreen } from "@/components/f5/Selesai";
import { demoEvent, demoSessions, NAMES } from "@/lib/fixtures";
import { firstName } from "@/lib/format";
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
const sessions = demoSessions.map((s) => ({ id: s.id, title: s.title }));
const HEIGHTS = [1280, 960, 1280, 1100, 800, 1280]; // rasio bervariasi seperti contoh Figma

// 48 foto dari 20 tamu, terbaru dulu; tamu ke-0 = Rara (pemilik HP, "Fotoku").
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

const bukuTamu = (preview: Parameters<typeof BukuTamuScreen>[0]["preview"]) => (
  <BukuTamuScreen
    token={null}
    sessions={sessions}
    backHref={back}
    kolaseHref={back}
    preview={preview}
  />
);

const FILLED = { rating: 4, highlight: "s02", improve: "", invite: "mau" as const };

export const SCREENS: ScreenDef[] = [
  {
    code: "BT12",
    name: "Acara selesai",
    kind: "Utama",
    lane: "Tamu",
    render: () => (
      <SelesaiScreen
        eyebrow="17.02 · 4 dari 4 bagian selesai"
        photoCount={48}
        photoGuests={20}
        guestCount={20}
        latest={PHOTOS.slice(0, 4).map((p) => ({ id: p.id, tone: p.tone }))}
        kolaseHref={back}
        bukuTamuHref={back}
      />
    ),
  },
  {
    code: "BT12-luar",
    name: "Acara selesai · belum check-in",
    kind: "Kasus lain",
    lane: "Tamu",
    render: () => (
      <SelesaiLuarScreen
        eyebrow={`${demoEvent.name} · Minggu, 8 Nov`}
        followHref={igProfileUrl(POTARA_IG)}
      />
    ),
  },
  {
    code: "T14",
    name: "Buku tamu",
    kind: "Utama",
    lane: "Tamu",
    render: () => bukuTamu({ draft: FILLED }),
  },
  {
    code: "T14b",
    name: "Buku tamu gagal kirim",
    kind: "Gagal",
    lane: "Tamu",
    render: () =>
      bukuTamu({ draft: { ...FILLED, improve: "Parkir motornya agak sempit." }, failed: true }),
  },
  {
    code: "T14c",
    name: "Rating belum diisi",
    kind: "Gagal",
    lane: "Tamu",
    render: () => bukuTamu({ draft: { ...FILLED, rating: 0 }, hint: true }),
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
];

// T15e = share sheet bawaan HP (navigator.share), bukan layar kita: uji dari T15 / T15c di HP.
