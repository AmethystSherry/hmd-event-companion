import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, CaretRight, Trash, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { cardOf } from "@/lib/card";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import styles from "../f1/states.module.css";
import { devClearMyCard, devOnlyTwoHere, devResetCards, devSeedCards } from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "N3 states · dev" };

const TONE = { Utama: "neutral", Kasus: "crew", Aksi: "live", Gagal: "danger" } as const;

// /dev/states/n3: daftar layar N3 Kenalan antartamu (pratinjau data contoh) + alat uji kartu.
export default function N3States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section N3 (4670:4888)" title="N3 · Kenalan antartamu" />
      <Card inset>
        <div className={styles.head}>
          <CardLabel>Tamu</CardLabel>
        </div>
        {SCREENS.map((s) => (
          <Link key={s.code} href={`/dev/states/n3/${s.code}`} className={styles.row}>
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

async function DevTools() {
  const store = await getStore();
  const guests = store.listGuests(HMD_ID);
  const inside = guests.filter((g) => store.ticketFor(g.id)?.status === "dipakai");
  const withCard = guests.filter((g) => {
    const c = cardOf(g);
    return c.role || c.askAbout.length;
  });
  const me = guests.find((g) => g.name.startsWith("Rara"));
  return (
    <Card>
      <CardLabel>Kartu kenalan (store lokal .data/)</CardLabel>
      <p className="t-body-emph">
        {withCard.length} dari {guests.length} tamu punya kartu · {inside.length} udah masuk
      </p>
      <p className="t-label c-label-2">
        Urutan uji: /dev/states/f2 Siapkan data uji → check-in → buka layar acara 2 tamu di HP/tab
        berbeda → Tamu → Ubah → Simpan. Kartu baru muncul di HP lain ≤ 3 dtk.
      </p>
      <div className={styles.links}>
        <form action={devSeedCards}>
          <Button size="sm" type="submit" icon={<Users />}>
            Isi kartu dummy semua tamu
          </Button>
        </form>
        <form action={devClearMyCard}>
          <Button size="sm" variant="secondary" type="submit" icon={<Trash />}>
            Kosongkan kartu saya (Rara)
          </Button>
        </form>
        <form action={devOnlyTwoHere}>
          <Button size="sm" variant="secondary" type="submit" icon={<Users />}>
            Cuma 2 yang udah datang
          </Button>
        </form>
        <form action={devResetCards}>
          <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
            Reset kartu
          </Button>
        </form>
      </div>
      <CardLabel>Link</CardLabel>
      <div className={styles.links}>
        {me && (
          <a href={`/t/${me.token}/acara?sheet=tamu`} target="_blank" className={styles.link}>
            Tamu di sini {me.name}
          </a>
        )}
        {inside
          .filter((g) => g.id !== me?.id)
          .slice(0, 2)
          .map((g) => (
            <a
              key={g.id}
              href={`/t/${g.token}/acara?sheet=tamu`}
              target="_blank"
              className={styles.link}
            >
              Tamu di sini {g.name}
            </a>
          ))}
        {!inside.length && <span className="t-label c-label-2">Belum ada tamu yang check-in.</span>}
      </div>
    </Card>
  );
}
