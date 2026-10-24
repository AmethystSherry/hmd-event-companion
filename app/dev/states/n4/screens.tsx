import type { ReactNode } from "react";
import { KolaseApp, type KolaseResult } from "@/components/n4/KolaseApp";
import type { CameraStatus } from "@/components/n4/useCamera";
import type { PhotoSummary } from "@/lib/data/types";
import { demoEvent } from "@/lib/fixtures";
import { polaroidDate } from "@/lib/photo";

// Registri layar N4 (N4-deliverables.md "Daftar layar", Figma 4670:4981) untuk
// /dev/states/n4/[code]. Komponen sama dengan route asli, data contoh, tanpa kamera/server.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Gagal" | "Kasus lain";
  render: () => ReactNode;
};

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const MINE: KolaseResult = { kind: "sent", id: id(99) };
// Contoh Figma: 34 foto tamu lain → strip 4 + "+30".
const FULL: PhotoSummary = { total: 35, others: 34, mine: 1, latest: [1, 2, 3, 4].map(id) };
const FIRST: PhotoSummary = { total: 1, others: 0, mine: 1, latest: [] };

function app(
  preview: {
    view: "kamera" | "hasil";
    camera?: CameraStatus;
    result?: KolaseResult;
    pending?: number;
    extraToast?: boolean;
  },
  summary = FULL,
) {
  return (
    <KolaseApp
      token="demo-token-n4-preview"
      name="Rara"
      date={polaroidDate(demoEvent.date)}
      endsAt={demoEvent.endsAt}
      backHref="/dev/states/n4"
      summary={summary}
      lastOwnId={null}
      preview={preview}
    />
  );
}

export const SCREENS: ScreenDef[] = [
  {
    code: "BT06",
    name: "Kamera kolase",
    kind: "Utama",
    render: () => app({ view: "kamera", result: MINE }),
  },
  {
    code: "BT07",
    name: "Foto masuk kolase",
    kind: "Utama",
    render: () => app({ view: "hasil", result: MINE }),
  },
  {
    code: "BT06b",
    name: "Izin kamera ditolak",
    kind: "Gagal",
    render: () => app({ view: "kamera", camera: "denied" }),
  },
  {
    code: "BT07b",
    name: "Gagal upload (diantre)",
    kind: "Gagal",
    render: () => app({ view: "hasil", result: { ...MINE, kind: "queued" }, pending: 1 }),
  },
  {
    code: "BT07c",
    name: "Tap +N sebelum acara selesai",
    kind: "Kasus lain",
    render: () => app({ view: "hasil", result: MINE, extraToast: true }),
  },
  {
    code: "BT06-cadangan",
    name: "Kamera bawaan HP (webview IG / tanpa getUserMedia)",
    kind: "Kasus lain",
    render: () => app({ view: "kamera", camera: "unsupported" }),
  },
  {
    code: "BT07-pertama",
    name: "Foto pertama di kulkas (0 foto tamu lain)",
    kind: "Kasus lain",
    render: () => app({ view: "hasil", result: MINE }, FIRST),
  },
];
