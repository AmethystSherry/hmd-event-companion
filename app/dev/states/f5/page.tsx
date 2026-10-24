import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowCounterClockwise,
  BookOpen,
  Camera,
  CaretRight,
  Clock,
  DownloadSimple,
  LockSimple,
  Sparkle,
  Stop,
} from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { seedPhotos } from "../n4/actions";
import { SCREENS } from "./screens";
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

const TONE = { Utama: "neutral", Gagal: "danger", "Kasus lain": "crew" } as const;

// /dev/states/f5: daftar layar F5 (pratinjau data contoh) + alat uji tutup acara, buku tamu,
// ringkasan Claude, dan hapus data H+30. Layar panitia (BP04*, P11*) menyusul (Prompt D).
export default function F5States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section F5 (4671:4888)" title="F5 · Tutup acara" />
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Tamu · T15e = share sheet HP (uji dari T15/T15c)</CardLabel>
        </div>
        {SCREENS.map((s) => (
          <Link key={s.code} href={`/dev/states/f5/${s.code}`} className={styles.row}>
            <span className={`t-label-emph tabular ${styles.code}`}>{s.code}</span>
            <span className="t-body">{s.name}</span>
            <Badge tone={TONE[s.kind]}>{s.kind}</Badge>
            <CaretRight size={14} className="c-label-3" />
          </Link>
        ))}
      </Card>
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
  const all = store.listGuests(HMD_ID).map((g) => ({
    g,
    inside: store.ticketFor(g.id)?.status === "dipakai",
  }));
  const guests = [
    ...all.filter((x) => x.inside).slice(0, 3),
    ...all.filter((x) => !x.inside).slice(0, 1),
  ];
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
          Urutan uji: /dev/states/f2 Siapkan data → Isi 15 feedback (check-in + tutup) atau isi foto
          dummy dulu (upload ditolak setelah ditutup). Tutup acara boleh kalau nggak ada sesi yang
          jalan dan sesi terakhir udah selesai. HP tamu yang terbuka pindah ke BT12 sendiri.
        </p>
        <div className={styles.links}>
          <form action={seedPhotos}>
            <Button size="sm" type="submit" icon={<Camera />}>
              Isi 30 foto dummy (sebelum tutup)
            </Button>
          </form>
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
        <CardLabel>Link tamu (udah masuk · belum masuk)</CardLabel>
        <div className={styles.links}>
          {guests.map(({ g, inside }) => (
            <a key={g.id} href={`/t/${g.token}`} target="_blank" className={styles.link}>
              {g.name}
              {inside ? "" : " (belum masuk)"}
            </a>
          ))}
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
