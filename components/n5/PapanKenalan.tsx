"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState, useTransition } from "react";
import { ArrowClockwise, CaretLeft, HandWaving, Info, Trophy } from "@/components/icons";
import type { AnnounceResult } from "@/app/panitia/actions";
import {
  Badge,
  Banner,
  Button,
  Dialog,
  HeroState,
  IconButton,
  Screen,
  Toast,
  TopToast,
} from "@/components/ui";
import n1 from "@/components/n1/n1.module.css";
import { deviceLabel } from "@/lib/device";
import { timeWib } from "@/lib/format";
import type { KenalanBoard } from "@/lib/kenalan";
import { Leaderboard } from "./Leaderboard";
import s from "./n5.module.css";

// N5 · P14 Papan kenalan (Figma 5305:10440, pola P10 N1; update 6 Nov: `Leaderboard` = podium #2 · #1 ·
// #3 di latar halaman + daftar mulai #4 di kartu putih, satuan "Point"): peringkat realtime (LiveRefresh di page), "Umumkan pemenang" → Dialog P14b (5332:9838) → server action → papan dikunci + semua HP tamu
// dapat BTk5. Dua HP panitia barengan: yang pertama menang, HP lain dapat toast (pola BP02d, K10 F4).
// K12: kosong → HeroState + tombol redup; udah diumumin → Banner + tanpa tombol (read-only).

export function PapanKenalanScreen({
  eventId,
  board,
  phaseLabel,
  announce,
  initialConfirm,
}: {
  eventId: string;
  board: KenalanBoard;
  phaseLabel: string; // "Hari-H · Live"
  announce?: (eventId: string, by: string | null) => Promise<AnnounceResult>; // kosong = pratinjau
  initialConfirm?: boolean; // /dev/states/n5 P14b
}) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(!!initialConfirm);
  const [pending, start] = useTransition();
  const [error, setError] = useState<{ key: number; text: string } | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);
  useEffect(() => {
    if (!conflict) return;
    const t = setTimeout(() => setConflict(null), 4000);
    return () => clearTimeout(t);
  }, [conflict]);

  const { rows, winner } = board;
  const top = rows[0];
  const empty = rows.length === 0;

  function run() {
    if (!announce || pending) return;
    start(async () => {
      const me = deviceLabel();
      const r = await announce(eventId, me).catch(() => null);
      setConfirm(false);
      if (!r)
        return setError({ key: Date.now(), text: "Gagal ngumumin, cek sinyal terus coba lagi" });
      if (!r.ok) return setError({ key: Date.now(), text: r.error });
      if (!r.changed && r.by && r.by !== me) {
        setConflict(`${r.by} udah umumin pemenang duluan. Layarmu ikut update.`);
      }
    });
  }

  return (
    <Screen
      withBack
      className={s.boardScreen}
      bottom={
        winner ? undefined : (
          <Button
            icon={<Trophy />}
            onClick={() => !empty && setConfirm(true)}
            aria-disabled={empty || !board.open}
          >
            Umumkan pemenang
          </Button>
        )
      }
    >
      <div className={n1.toolbar}>
        <IconButton
          href={`/panitia/event/${eventId}/kontrol`}
          label="Kembali ke Kontrol acara"
          icon={<CaretLeft />}
        />
        <Badge tone="crew" pulse>
          {phaseLabel}
        </Badge>
      </div>
      <header className={n1.head}>
        <div className={n1.headText}>
          <p className="t-label c-label-2">
            {board.joined} tamu ikutan · {board.pairs} pasang kenalan
          </p>
          <h1 className="t-title">Papan kenalan</h1>
        </div>
        <IconButton
          label="Muat ulang"
          icon={<ArrowClockwise size={20} />}
          onClick={() => startTransition(() => router.refresh())}
        />
      </header>

      {winner && (
        // K12 · TODO desain: papan setelah diumumin (read-only).
        <Banner
          tone="success"
          icon={<Trophy />}
          title={`Pemenang udah diumumin · ${timeWib(winner.announcedAt)}`}
        >
          {winner.name} · {winner.points} point. Papan kenalan dikunci.
        </Banner>
      )}

      {empty ? (
        // K12 · TODO desain: papan kosong.
        <div className={n1.empty}>
          <HeroState icon={<HandWaving />} title="Belum ada yang kenalan">
            Peringkat muncul di sini begitu tamu saling scan QR & selfie. Ingetin MC buat ngajak
            tamu kenalan.
          </HeroState>
        </div>
      ) : (
        <>
          {board.tie && !winner && (
            // K10 · TODO copy: #1 & #2 seri → yang duluan sampai menang.
            <p className="t-caption c-label-2">
              {top?.firstName} seri sama #2 · menang karena duluan sampai {top?.points} point.
            </p>
          )}
          <Leaderboard rows={rows} framed />
        </>
      )}

      <Dialog
        open={confirm}
        onClose={() => !pending && setConfirm(false)}
        title={`Umumkan ${top?.firstName ?? "pemenang"} sebagai pemenang?`}
        actions={
          <>
            <Button onClick={run} aria-disabled={pending} aria-busy={pending}>
              {pending ? "Ngumumin…" : "Ya, umumkan"}
            </Button>
            <Button variant="secondary" onClick={() => !pending && setConfirm(false)}>
              Batal
            </Button>
          </>
        }
      >
        Semua HP tamu langsung lihat pengumuman pemenang. Papan kenalan dikunci setelah ini.
      </Dialog>

      {error && (
        <div className={n1.toastDock}>
          <Toast key={error.key} icon={<Info />}>
            {error.text}
          </Toast>
        </div>
      )}
      {conflict && (
        <TopToast key={conflict} icon={<Trophy size={20} />} title="Diubah oleh panitia lain">
          {conflict}
        </TopToast>
      )}
    </Screen>
  );
}
