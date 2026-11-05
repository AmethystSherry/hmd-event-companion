import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, CaretRight, Trophy, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { kenalanBoard } from "@/lib/kenalan";
import styles from "../f1/states.module.css";
import { devAnnounce, devResetKenalan, devScanRara, devSeedKenalan } from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "N5 states · dev" };

const TONE = { Utama: "neutral", Kasus: "crew", Aksi: "live", Gagal: "danger" } as const;

// /dev/states/n5: daftar layar N5 Kenalan & hadiah (pratinjau data contoh) + alat uji papan.
// Panitia: BP02k banner Peringkat, P14 Papan kenalan, P14b Umumkan.
export default function N5States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section N5 (5305:9340)" title="N5 · Kenalan & hadiah" />
      {(["Tamu", "Panitia"] as const).map((lane) => (
        <Card inset key={lane}>
          <div className={styles.head}>
            <CardLabel>{lane}</CardLabel>
          </div>
          {SCREENS.filter((x) => x.lane === lane).map((x) => (
            <Link key={x.code} href={`/dev/states/n5/${x.code}`} className={styles.row}>
              <span className={`t-label-emph tabular ${styles.code}`}>{x.code}</span>
              <span className="t-body">{x.name}</span>
              <Badge tone={TONE[x.kind]}>{x.kind}</Badge>
              <CaretRight size={14} className="c-label-3" />
            </Link>
          ))}
        </Card>
      ))}
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

async function DevTools() {
  const store = await getStore();
  const board = kenalanBoard(store, HMD_ID);
  const guests = store.listGuests(HMD_ID);
  const rara = guests.find((g) => g.name.startsWith("Rara"));
  const other = guests.find(
    (g) => g.id !== rara?.id && store.ticketFor(g.id)?.status === "dipakai",
  );
  return (
    <Card>
      <CardLabel>Papan kenalan (store lokal .data/)</CardLabel>
      <p className="t-body-emph">
        {board.joined} tamu ikutan · {board.pairs} pasang kenalan
      </p>
      {board.winner ? (
        <Badge tone="live">Pemenang: {board.winner.name}</Badge>
      ) : (
        <Badge tone={board.open ? "crew" : "neutral"}>
          {board.open ? "Papan kebuka" : "Papan tutup"}
        </Badge>
      )}
      {board.rows.slice(0, 5).map((r) => (
        <p key={r.guestId} className="t-label">
          {r.rank}. {r.name} · {r.count} kenalan · terakhir {r.lastLabel}
        </p>
      ))}
      <p className="t-label c-label-2">
        Urutan uji: /dev/states/f2 Siapkan data uji → 23 kenalan dummy (event dimulai, tamu yang
        terlibat check-in) → HP lain scan QR {rara?.name.split(" ")[0] ?? "Rara"} → Umumkan
        pemenang.
      </p>
      <div className={styles.links}>
        <form action={devSeedKenalan}>
          <Button size="sm" type="submit" icon={<Users />}>
            23 kenalan dummy
          </Button>
        </form>
        <form action={devScanRara}>
          <Button size="sm" variant="secondary" type="submit" icon={<Users />}>
            HP lain scan QR Rara
          </Button>
        </form>
        <form action={devAnnounce}>
          <Button size="sm" variant="secondary" type="submit" icon={<Trophy />}>
            Umumkan pemenang
          </Button>
        </form>
        <form action={devResetKenalan}>
          <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
            Reset kenalan
          </Button>
        </form>
      </div>
      <CardLabel>Link (buka di 2 tab / HP)</CardLabel>
      <div className={styles.links}>
        {[rara, other].map(
          (g) =>
            g && (
              <span key={g.id} className={styles.links}>
                <a href={`/t/${g.token}/acara`} target="_blank" className={styles.link}>
                  Acara {g.name}
                </a>
                <a href={`/t/${g.token}/kenalan?tab=qr`} target="_blank" className={styles.link}>
                  QR saya {g.name}
                </a>
              </span>
            ),
        )}
      </div>
    </Card>
  );
}
