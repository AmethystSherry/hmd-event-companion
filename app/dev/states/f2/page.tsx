import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, CaretRight, Clock, Play, Stop, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { dateLong, timeWib, wibDate } from "@/lib/format";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { appOrigin } from "@/lib/server/url";
import styles from "../f1/states.module.css";
import {
  devFinishActiveSession,
  devStartFirstSession,
  resetCheckIns,
  seedF2,
  setFakeNow,
} from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "F2 states · dev" };

const TONE = { Utama: "neutral", Gagal: "danger", "Kasus lain": "crew" } as const;

// /dev/states/f2: daftar layar F2 (pratinjau data contoh) + alat uji alur check-in asli.
export default function F2States() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Dev · Figma band F2 (4667:4654)"
        title={`F2 · ${SCREENS.length} layar`}
      />
      {(["Tamu", "Panitia"] as const).map((lane) => (
        <Card key={lane} inset>
          <div className={styles.head}>
            <CardLabel>{lane}</CardLabel>
          </div>
          {SCREENS.filter((s) => s.lane === lane).map((s) => (
            <Link key={s.code} href={`/dev/states/f2/${s.code}`} className={styles.row}>
              <span className={`t-label-emph tabular ${styles.code}`}>{s.code}</span>
              <span className="t-body">{s.name}</span>
              <Badge tone={TONE[s.kind]}>{s.kind}</Badge>
              <CaretRight size={14} className="c-label-3" />
            </Link>
          ))}
        </Card>
      ))}
      {process.env.NODE_ENV !== "production" && (
        <Suspense>
          <DevTools />
        </Suspense>
      )}
    </Screen>
  );
}

const DAY_OPEN = "2026-11-08T12:55:00+07:00";

async function DevTools() {
  const store = await getStore();
  const origin = await appOrigin();
  const now = await serverNow();
  const event = store.getEvent(HMD_ID)!;
  const day = isEventDay(event.date, now);
  const stats = store.doorStats(HMD_ID);
  const active = store.listSessions(HMD_ID).find((x) => x.status === "berlangsung");
  const session = active
    ? `${active.title} lagi jalan`
    : `mode ${event.mode ?? "pre"} · belum ada yang jalan`;
  const tickets = new Map(store.listTickets(HMD_ID).map((t) => [t.guestId, t]));
  const guests = store.listGuests(HMD_ID).filter((g) => tickets.has(g.id));
  return (
    <>
      <Card>
        <CardLabel>Jam server (cookie, browser ini saja)</CardLabel>
        <p className="t-body-emph">
          {dateLong(wibDate(now))} · {timeWib(now.toISOString())} WIB{day ? " · hari-H" : ""}
        </p>
        <p className="t-label c-label-2">
          Hari-H mulai 00.00 WIB {dateLong(event.date)}. Geser jam supaya tiket tamu jadi T05 dan
          Home event jadi BP02. HP lain tetap pakai jam asli, kecuali tombol ini ditap di HP itu.
        </p>
        <div className={styles.links}>
          <form action={setFakeNow.bind(null, DAY_OPEN)}>
            <Button size="sm" type="submit" icon={<Clock />}>
              Pura-pura hari-H (12.55)
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
        <CardLabel>Uji check-in (store lokal .data/)</CardLabel>
        <p className="t-label c-label-2">
          1. Siapkan data · 2. Pura-pura hari-H · 3. Buka link tamu di satu tab, /panitia → Scan
          tiket di tab/HP lain · 4. Scan QR atau tap ✓ di Cari nama → tiket tamu sobek. Kamera di HP
          butuh HTTPS: jalankan npx next dev --experimental-https.
        </p>
        <p className="t-body-emph">
          {stats.checkedIn} dari {stats.expected} udah masuk · {stats.total} tamu
        </p>
        <div className={styles.links}>
          <form action={seedF2}>
            <Button size="sm" type="submit" icon={<Users />}>
              Siapkan data uji (12 hadir)
            </Button>
          </form>
          <form action={resetCheckIns}>
            <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
              Reset semua check-in
            </Button>
          </form>
          <form action={devStartFirstSession}>
            <Button size="sm" type="submit" icon={<Play />}>
              Mulai sesi 1
            </Button>
          </form>
          <form action={devFinishActiveSession}>
            <Button size="sm" variant="secondary" type="submit" icon={<Stop />}>
              Selesaikan sesi
            </Button>
          </form>
          <p className="t-label c-label-2">Sesi: {session}</p>
          <Link className={`t-label-emph ${styles.link}`} href={`/panitia/event/${HMD_ID}`}>
            Buka Home event panitia →
          </Link>
        </div>
      </Card>
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Link tamu bertiket ({guests.length})</CardLabel>
        </div>
        {guests.length === 0 ? (
          <p className={`t-label c-label-2 ${styles.row}`}>Belum ada tiket — siapkan data dulu.</p>
        ) : (
          guests.map((g) => {
            const t = tickets.get(g.id)!;
            return (
              <a key={g.id} href={`/t/${g.token}`} className={styles.row}>
                <span className="t-label c-label-2 tabular">{t.shortCode.slice(4, 7)}</span>
                <span className="t-body">{g.name}</span>
                <Badge tone={t.status === "dipakai" ? "success" : "neutral"}>
                  {t.status === "dipakai" ? "Udah masuk" : "Belum masuk"}
                </Badge>
                <span
                  className={`t-label c-label-3 ${styles.url}`}
                >{`${origin}/t/${g.token}`}</span>
              </a>
            );
          })
        )}
      </Card>
    </>
  );
}
