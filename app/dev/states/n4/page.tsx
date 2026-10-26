import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, Camera, CaretRight, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { appOrigin } from "@/lib/server/url";
import styles from "../f1/states.module.css";
import { checkInAll, resetPhotos, seedPhotos } from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "N4 states · dev" };

const TONE = {
  "Titik mulai": "neutral",
  Utama: "neutral",
  Gagal: "danger",
  "Kasus lain": "crew",
} as const;

// /dev/states/n4: daftar layar N4 (pratinjau data contoh) + alat uji foto kolase asli.
export default function N4States() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Dev · Figma section N4 (4670:4981, 26 Okt)"
        title={`N4 · ${SCREENS.length} layar`}
      />
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Tamu</CardLabel>
        </div>
        {SCREENS.map((s) => (
          <Link key={s.code} href={`/dev/states/n4/${s.code}`} className={styles.row}>
            <span className={`t-label-emph tabular ${styles.code}`}>{s.code}</span>
            <span className="t-body">{s.name}</span>
            <Badge tone={TONE[s.kind]}>{s.kind}</Badge>
            <CaretRight size={14} className="c-label-3" />
          </Link>
        ))}
      </Card>
      {process.env.NODE_ENV !== "production" && (
        <Suspense>
          <DevTools />
        </Suspense>
      )}
    </Screen>
  );
}

async function DevTools() {
  const store = await getStore();
  const origin = await appOrigin();
  const tickets = new Map(store.listTickets(HMD_ID).map((t) => [t.guestId, t]));
  const inside = store.listGuests(HMD_ID).filter((g) => tickets.get(g.id)?.status === "dipakai");
  const photos = store.listPhotos(HMD_ID);
  return (
    <>
      <Card>
        <CardLabel>Uji foto kolase (store lokal .data/)</CardLabel>
        <p className="t-label c-label-2">
          1. /dev/states/f2 → Siapkan data uji · 2. Check-in semua di bawah · 3. Buka link kamera
          tamu → jepret. Kamera di HP butuh HTTPS (npx next dev --experimental-https); tanpa itu
          otomatis pakai kamera bawaan HP. Matikan Wi-Fi di HP untuk lihat BT07b (antre).
        </p>
        <p className="t-body-emph">
          {photos.length} foto di kulkas · {inside.length} tamu udah masuk
        </p>
        <div className={styles.links}>
          <form action={checkInAll}>
            <Button size="sm" type="submit" icon={<Users />}>
              Check-in semua tamu bertiket
            </Button>
          </form>
          <form action={seedPhotos}>
            <Button size="sm" type="submit" icon={<Camera />}>
              Isi 30 foto dummy
            </Button>
          </form>
          <form action={resetPhotos}>
            <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
              Hapus semua foto
            </Button>
          </form>
        </div>
      </Card>
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Link kamera tamu yang udah masuk ({inside.length})</CardLabel>
        </div>
        {inside.length === 0 ? (
          <p className={`t-label c-label-2 ${styles.row}`}>Belum ada yang masuk.</p>
        ) : (
          inside.map((g) => (
            <a key={g.id} href={`/t/${g.token}/foto`} className={styles.row}>
              <span className="t-body">{g.name}</span>
              <Badge tone="neutral">{photos.filter((p) => p.guestId === g.id).length} foto</Badge>
              <span
                className={`t-label c-label-3 ${styles.url}`}
              >{`${origin}/t/${g.token}/foto`}</span>
            </a>
          ))
        )}
      </Card>
    </>
  );
}
