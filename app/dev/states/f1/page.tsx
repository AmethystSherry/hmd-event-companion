import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, CaretRight, DownloadSimple } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { appOrigin } from "@/lib/server/url";
import { resetDemo } from "./actions";
import { SCREENS } from "./screens";
import styles from "./states.module.css";

export const metadata = { title: "F1 states · dev" };

const TONE = { Utama: "neutral", Gagal: "danger", "Kasus lain": "crew", Aksi: "success" } as const;

// /dev/states/f1: daftar layar F1 (pratinjau data contoh) + alat uji alur asli di store lokal.
export default function F1States() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Dev · Figma band F1 (4732:12593)"
        title={`F1 · ${SCREENS.length} layar`}
      />
      {(["Tamu", "Panitia"] as const).map((lane) => (
        <Card key={lane} inset>
          <div className={styles.head}>
            <CardLabel>{lane}</CardLabel>
          </div>
          {SCREENS.filter((s) => s.lane === lane).map((s) => (
            <Link key={s.code} href={`/dev/states/f1/${s.code}`} className={styles.row}>
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

// Alat uji alur asli: CSV dummy, link tamu dari store lokal, reset data. Tidak tampil di production.
async function DevTools() {
  const store = await getStore();
  const origin = await appOrigin();
  const guests = store.listGuests(HMD_ID);
  return (
    <>
      <Card>
        <CardLabel>Uji alur asli (store lokal .data/)</CardLabel>
        <p className="t-label c-label-2">
          1. Masuk /panitia pakai EVENT_PIN di .env.local · 2. Home event → Tamu & undangan → Pilih
          file CSV · 3. Buka link tamu di HP lain → konfirmasi · 4. Lihat P04 berubah tanpa reload.
        </p>
        <div className={styles.links}>
          <a className={`t-label-emph ${styles.link}`} href="/dev/tamu-hmd-dummy.csv" download>
            <DownloadSimple size={16} /> tamu-hmd-dummy.csv (20 baris)
          </a>
          <a className={`t-label-emph ${styles.link}`} href="/dev/tamu-hmd-error.csv" download>
            <DownloadSimple size={16} /> tamu-hmd-error.csv (3 baris error)
          </a>
          <a className={`t-label-emph ${styles.link}`} href="/dev/tamu-hmd-ig.csv" download>
            <DownloadSimple size={16} /> tamu-hmd-ig.csv (3 IG perlu dicek)
          </a>
        </div>
        <form action={resetDemo}>
          <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
            Reset data ke awal
          </Button>
        </form>
      </Card>
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Link tamu ({guests.length})</CardLabel>
        </div>
        {guests.length === 0 ? (
          <p className={`t-label c-label-2 ${styles.row}`}>Belum ada tamu — unggah CSV dulu.</p>
        ) : (
          guests.map((g) => (
            <a key={g.id} href={`/t/${g.token}`} className={styles.row}>
              <span className="t-body">{g.name}</span>
              <span className="t-label c-label-2">
                {g.inviteStatus === "diundang" ? "diundang" : "belum"} · {g.rsvp}
              </span>
              <span className={`t-label c-label-3 ${styles.url}`}>{`${origin}/t/${g.token}`}</span>
            </a>
          ))
        )}
      </Card>
    </>
  );
}
