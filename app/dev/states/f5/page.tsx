import { Suspense } from "react";
import {
  ArrowCounterClockwise,
  BookOpen,
  Clock,
  DownloadSimple,
  LockSimple,
  Sparkle,
  Stop,
} from "@/components/icons";
import { Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { purgeAt } from "@/lib/feedback";
import { dateLong, timeWib, wibDate } from "@/lib/format";
import { serverNow } from "@/lib/server/clock";
import { setFakeNow } from "../f2/actions";
import styles from "../f1/states.module.css";
import {
  devCloseEvent,
  devFinishAllSessions,
  devRefreshSummary,
  devReopenEvent,
  devResetFeedback,
  devSeedFeedback,
} from "./actions";

export const metadata = { title: "F5 states · dev" };

// /dev/states/f5: alat uji tutup acara, buku tamu, ringkasan Claude, dan hapus data H+30.
// Layar F5 (BT12, T14*, T15*, BP04*, P11*) menyusul.
export default function F5States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section F5 (4671:4888)" title="F5 · Tutup acara" />
      {process.env.NODE_ENV !== "production" ? (
        <Suspense>
          <DevTools />
        </Suspense>
      ) : (
        <p className="t-body c-label-2">Alat uji cuma ada di dev.</p>
      )}
    </Screen>
  );
}

const DAY_CLOSE = "2026-11-08T17:00:00+07:00";
const AFTER_PURGE = "2026-12-08T09:00:00+07:00";

async function DevTools() {
  const store = await getStore();
  const now = await serverNow();
  const event = store.getEvent(HMD_ID)!;
  const recap = store.feedbackRecap(HMD_ID);
  const done = store.listSessions(HMD_ID).filter((s) => s.status === "selesai").length;
  const total = store.listSessions(HMD_ID).length;
  const summary = event.summary;
  return (
    <>
      <Card>
        <CardLabel>Jam server (cookie, browser ini saja)</CardLabel>
        <p className="t-body-emph">
          {dateLong(wibDate(now))} · {timeWib(now.toISOString())} WIB
        </p>
        <p className="t-label c-label-2">
          Data per orang dihapus otomatis mulai {dateLong(wibDate(purgeAt(event.date)))} 00.00 WIB,
          saat link tamu / Kontrol acara / CSV dibuka. Habis loncat ke 8 Des, balikin data lewat
          /dev/states/f1 → Reset data.
        </p>
        <div className={styles.links}>
          <form action={setFakeNow.bind(null, DAY_CLOSE)}>
            <Button size="sm" type="submit" icon={<Clock />}>
              Hari-H 17.00
            </Button>
          </form>
          <form action={setFakeNow.bind(null, AFTER_PURGE)}>
            <Button size="sm" variant="destructive" type="submit" icon={<Clock />}>
              Loncat ke 8 Des 2026
            </Button>
          </form>
          <form action={setFakeNow.bind(null, null)}>
            <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
              Pakai jam asli
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardLabel>Tutup acara (store lokal .data/)</CardLabel>
        <p className="t-body-emph">
          mode {event.mode ?? "pre"} · {done}/{total} sesi selesai
          {event.closedAt ? ` · ditutup ${timeWib(event.closedAt)}` : ""}
          {event.purgedAt ? " · data per orang udah dihapus" : ""}
        </p>
        <p className="t-label c-label-2">
          Tutup acara boleh kalau nggak ada sesi yang jalan dan sesi terakhir udah selesai.
        </p>
        <div className={styles.links}>
          <form action={devFinishAllSessions}>
            <Button size="sm" type="submit" icon={<Stop />}>
              Selesaikan semua sesi
            </Button>
          </form>
          <form action={devCloseEvent}>
            <Button size="sm" type="submit" icon={<BookOpen />}>
              Tutup acara
            </Button>
          </form>
          <form action={devReopenEvent}>
            <Button size="sm" variant="secondary" type="submit" icon={<LockSimple />}>
              Buka lagi (dev)
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardLabel>Buku tamu & rekap</CardLabel>
        <p className="t-body-emph">
          {recap.respondents} dari {recap.expected} tamu mengisi · rata-rata{" "}
          {recap.avgRating?.toFixed(1).replace(".", ",") ?? "–"} · mau diundang{" "}
          {recap.inviteAgainPct ?? "–"}%
        </p>
        <p className="t-label c-label-2">
          Paling seru: {recap.highlights.map((h) => `${h.title} ${h.count}`).join(" · ") || "–"}
        </p>
        <p className="t-label c-label-2">
          Ringkasan Claude:{" "}
          {summary?.points
            ? summary.points.join(" / ")
            : summary?.error
              ? `gagal (${summary.error})`
              : "belum ada"}
          {summary ? ` · dari ${summary.basedOn} jawaban` : ""}
        </p>
        <div className={styles.links}>
          <form action={devSeedFeedback}>
            <Button size="sm" type="submit" icon={<BookOpen />}>
              Isi 15 feedback dummy
            </Button>
          </form>
          <form action={devRefreshSummary}>
            <Button size="sm" type="submit" icon={<Sparkle />}>
              Buat ringkasan sekarang
            </Button>
          </form>
          <a href={`/api/panitia/event/${HMD_ID}/rekap.csv`} className={styles.link}>
            <DownloadSimple size={14} /> Unduh CSV (perlu PIN)
          </a>
          <form action={devResetFeedback}>
            <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
              Reset feedback
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
