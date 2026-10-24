"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CaretLeft,
  DownloadSimple,
  Info,
  Sparkle,
  Star,
  Users,
} from "@/components/icons";
import {
  Banner,
  BarList,
  Button,
  Card,
  CardLabel,
  HeroState,
  IconButton,
  Screen,
  ScreenHeader,
  Skeleton,
  StatTile,
  TextAction,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import type { FeedbackRecap } from "@/lib/data/types";
import type { SummaryView } from "@/lib/feedback";
import s from "./f5.module.css";

// P11 · Rekap buku tamu (+ P11b ringkasan gagal, P11c belum ada feedback, P11d data per orang
// udah dihapus). Angka & bar dari server (update lewat rev → SSE). Ringkasan Claude nggak
// memblokir render: kalau perlu dibuat, HP ini memanggil POST …/ringkasan lalu refresh.

const pad2 = (n: number) => String(n).padStart(2, "0");

export function RekapScreen({
  eventId,
  backHref,
  recap,
  summary,
  purgeDate,
  csvHref,
}: {
  eventId: string | null; // null = pratinjau (tanpa server)
  backHref: string;
  recap: FeedbackRecap;
  summary: SummaryView;
  purgeDate: string; // "8 Des 2026"
  csvHref: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const asked = useRef(-1); // jumlah jawaban saat terakhir minta dibuat
  const purged = !!recap.purgedAt;
  const empty = recap.respondents === 0;
  const csvOff = empty || purged;

  async function requestSummary(force: boolean) {
    if (!eventId) return;
    setBusy(true);
    try {
      await fetch(`/api/panitia/event/${eventId}/ringkasan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
    } catch {
      // tetap P11b; "Coba lagi" bisa ditap lagi
    }
    setBusy(false);
    router.refresh();
  }

  // Ringkasan basi / belum ada → minta dibuat (sekali per jumlah jawaban).
  useEffect(() => {
    const request = (summary.kind === "pending" || summary.kind === "ready") && summary.request;
    if (!request || asked.current === recap.respondents || !eventId) return;
    asked.current = recap.respondents;
    void requestSummary(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cukup sekali saat dibutuhkan
  }, [summary, eventId, recap.respondents]);

  const dash = (v: string) => (empty ? "–" : v);
  return (
    <Screen
      withBack
      bottomHeight={82}
      bottom={
        <>
          <p className={cx("t-label c-label-2", s.footerNote)}>
            {purged
              ? `Data per orang dihapus ${purgeDate} · CSV nonaktif`
              : `Data tamu terhapus otomatis ${purgeDate}`}
          </p>
          {csvOff ? (
            <Button icon={<DownloadSimple />} aria-disabled>
              Unduh CSV
            </Button>
          ) : (
            <form action={csvHref} method="get" className={s.csvForm}>
              <Button type="submit" icon={<DownloadSimple />}>
                Unduh CSV
              </Button>
            </form>
          )}
        </>
      }
    >
      <ScreenHeader
        leading={<IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />}
        eyebrow={`${recap.respondents} dari ${recap.expected} tamu mengisi`}
        title="Rekap buku tamu"
      />

      <div className={s.recapTiles}>
        <StatTile
          icon={<Star size={18} />}
          value={dash(recap.avgRating?.toFixed(1).replace(".", ",") ?? "–")}
          label="Rata-rata"
        />
        <StatTile
          icon={<BookOpen size={18} />}
          value={dash(`${recap.respondents}/${recap.expected}`)}
          label="Mengisi"
        />
        <StatTile
          icon={<Users size={18} />}
          value={dash(recap.inviteAgainPct === null ? "–" : `${recap.inviteAgainPct}%`)}
          label="Mau diundang"
        />
      </div>

      {purged && (
        <Banner
          tone="warning"
          icon={<Info />}
          title={`Data per orang udah dihapus ${purgeDate.replace(/ \d{4}$/, "")}`}
        >
          Rekap tanpa nama tetap ada. Jawaban per tamu & CSV nggak bisa dibuka lagi.
        </Banner>
      )}

      {empty && !purged ? (
        <HeroState icon={<BookOpen size={30} />} title="Belum ada feedback" className={s.empty}>
          Buku tamu kebuka otomatis setelah acara ditutup. Jawaban tamu muncul di sini.
        </HeroState>
      ) : (
        <>
          <Card>
            <CardLabel>Bagian paling seru</CardLabel>
            <BarList
              label="Bagian paling seru"
              items={recap.highlights.map((h) => ({
                key: h.sessionId,
                label: h.title,
                value: h.count,
              }))}
            />
          </Card>

          {summary.kind === "failed" ? (
            <Banner
              tone="warning"
              icon={<Sparkle />}
              title="Ringkasan belum bisa dibuat"
              action={
                <TextAction onClick={() => !busy && void requestSummary(true)}>
                  {busy ? "Lagi dibuat…" : "Coba lagi"}
                </TextAction>
              }
            >
              Angka & semua jawaban tetap lengkap di bawah.
            </Banner>
          ) : summary.kind === "none" ? null : (
            <Card>
              <p className={cx("t-label-emph", s.claudeLabel)}>
                <Sparkle size={16} weight="fill" />
                Ringkasan Claude
              </p>
              {summary.kind === "ready" ? (
                <ul className={cx("t-body", s.points)}>
                  {summary.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              ) : summary.kind === "waiting" ? (
                <p className="t-body c-label-2">Ringkasan muncul setelah ada 3 jawaban.</p>
              ) : (
                <div className={s.pointsLoading} aria-label="Ringkasan lagi dibuat">
                  <Skeleton height={18} radius={9} />
                  <Skeleton height={18} radius={9} />
                  <Skeleton height={18} radius={9} />
                </div>
              )}
            </Card>
          )}

          {summary.kind === "failed" && recap.improvements.length > 0 && (
            <Card inset>
              <p className={cx("t-label c-label-2", s.answersHead)}>
                Satu hal yang bisa diperbaiki · {recap.improvements.length} jawaban
              </p>
              <ul className={s.answers}>
                {recap.improvements.map((x) => (
                  <li key={x.no}>
                    <p className="t-body">{x.text}</p>
                    <p className="t-label c-label-3">Tamu #{pad2(x.no)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
