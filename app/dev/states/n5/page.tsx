import { Suspense } from "react";
import { ArrowCounterClockwise, Trophy, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { kenalanBoard } from "@/lib/kenalan";
import styles from "../f1/states.module.css";
import { devAnnounce, devResetKenalan, devScanRara, devSeedKenalan } from "./actions";

export const metadata = { title: "N5 states · dev" };

// /dev/states/n5: alat uji N5 Kenalan & hadiah (Prompt B: data & API). Daftar layar BT03h–BTk5,
// BP02k, P14 menyusul bersama layarnya (Prompt C/D).
export default function N5States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section N5 (5305:9340)" title="N5 · Kenalan & hadiah" />
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
  const rara = store.listGuests(HMD_ID).find((g) => g.name.startsWith("Rara"));
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
    </Card>
  );
}
